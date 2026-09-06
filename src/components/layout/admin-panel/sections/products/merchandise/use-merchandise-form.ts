"use client";

import { useCallback, useState } from "react";

import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";
import { uploadDirectFile } from "@/lib/client/direct-upload";
import type {
  AdminMerchandise,
  AdminMerchandiseImpact,
} from "@/lib/server/admin-merchandise";
import { messageFromError } from "@/utils/error-message";

import {
  createMerchandiseDraft,
  createMerchandiseDraftFrom,
  isMerchandiseDraftValid,
  type MerchandiseDraft,
} from "./merchandise-draft";
import {
  MerchandiseError,
  saveMerchandiseDraft,
  type MerchandiseSaveResult,
} from "./merchandise-service";

type UseMerchandiseFormArgs = {
  onSaved: (result: MerchandiseSaveResult, context: { isNew: boolean }) => void;
};

/**
 * Controlador único de criação/edição de brinde.
 *
 * A página de Brindes e o editor de Kit usam este mesmo hook: a regra de
 * validação, o upload e a confirmação de impacto existem em um lugar só, e o
 * brinde é salvo globalmente venha o formulário de onde vier.
 */
export function useMerchandiseForm({ onSaved }: UseMerchandiseFormArgs) {
  const [draft, setDraft] = useState<MerchandiseDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [pendingImpact, setPendingImpact] = useState<AdminMerchandiseImpact | null>(
    null,
  );
  const temporaryMedia = useTemporaryAdminMedia();

  const openCreate = useCallback(() => {
    setError("");
    setShowErrors(false);
    setPendingImpact(null);
    setDraft(createMerchandiseDraft());
  }, []);

  const openEdit = useCallback((merchandise: AdminMerchandise) => {
    setError("");
    setShowErrors(false);
    setPendingImpact(null);
    setDraft(createMerchandiseDraftFrom(merchandise));
  }, []);

  const close = useCallback(() => {
    if (saving) return;
    setDraft(null);
    setPendingImpact(null);
    setError("");
    temporaryMedia.discardAllExcept().catch(() => undefined);
  }, [saving, temporaryMedia]);

  const patch = useCallback((values: Partial<MerchandiseDraft>) => {
    setDraft((current) => (current ? { ...current, ...values } : current));
  }, []);

  const uploadImage = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");
      try {
        const payload = await uploadDirectFile<{
          media?: { id: number; src: string };
        }>("media", file);

        if (!payload.media) throw new Error("Não foi possível enviar a imagem.");

        temporaryMedia.track(payload.media.id);
        setDraft((current) => {
          // Trocar de imagem duas vezes antes de salvar deixaria a do meio
          // pendurada no storage; a persistida é solta pelo backend, no update.
          const supersededId = current?.imageAttachmentId;
          if (supersededId && temporaryMedia.isTracked(supersededId)) {
            temporaryMedia.discard([supersededId]).catch(() => undefined);
          }

          return current
            ? {
                ...current,
                imageAttachmentId: payload.media?.id,
                imageUrl: payload.media?.src ?? current.imageUrl,
              }
            : current;
        });
      } catch (uploadError) {
        setError(
          messageFromError(uploadError, "Não foi possível enviar a imagem."),
        );
      } finally {
        setUploading(false);
      }
    },
    [temporaryMedia],
  );

  const persist = useCallback(
    async (confirmImpact: boolean) => {
      if (!draft) return;

      setSaving(true);
      setError("");
      temporaryMedia.beginSave();
      try {
        const result = await saveMerchandiseDraft(draft, { confirmImpact });
        temporaryMedia.commit([result.merchandise.imageAttachmentId]);
        setPendingImpact(null);
        setDraft(null);
        onSaved(result, { isNew: !draft.id });
      } catch (saveError) {
        if (
          saveError instanceof MerchandiseError &&
          saveError.code === "papelito_merchandise_impact_confirmation_required" &&
          saveError.impact
        ) {
          setPendingImpact(saveError.impact);
          return;
        }

        setError(messageFromError(saveError, "Não foi possível salvar o brinde."));
      } finally {
        setSaving(false);
        temporaryMedia.endSave();
      }
    },
    [draft, onSaved, temporaryMedia],
  );

  const save = useCallback(async () => {
    if (!draft) return;

    if (!isMerchandiseDraftValid(draft)) {
      setShowErrors(true);
      setError("Revise os campos destacados antes de salvar.");
      return;
    }

    await persist(false);
  }, [draft, persist]);

  const confirmImpact = useCallback(async () => {
    await persist(true);
  }, [persist]);

  const cancelImpact = useCallback(() => {
    setPendingImpact(null);
  }, []);

  return {
    cancelImpact,
    close,
    confirmImpact,
    draft,
    error,
    openCreate,
    openEdit,
    patch,
    pendingImpact,
    save,
    saving,
    showErrors,
    uploading,
    uploadImage,
  };
}
