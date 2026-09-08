"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { ImageOff, ImagePlus, LoaderCircle, X } from "lucide-react";

import { AdminSelectField } from "@/components/layout/admin-panel/sections/products/components/admin-select-field";
import type { AdminCollection } from "@/lib/server/admin-taxonomy";
import { normalizeKey } from "@/utils/normalize-key";
import { uploadDirectFile } from "@/lib/client/direct-upload";
import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";

export type CollectionFormValues = {
  description: string;
  isActive: boolean;
  name: string;
  imageAttachmentId?: number | null;
  imageUrl?: string | null;
  slug?: string;
};

/**
 * O identificador é `VARCHAR(48)` na tabela de vínculo. Truncar aqui mantém a
 * prévia igual ao que o WordPress vai gravar, mas quem normaliza de verdade é o
 * backend — o formulário nunca é a autoridade.
 */
const SLUG_MAX_LENGTH = 48;

const STATUS_OPTIONS = [
  { label: "Ativa", value: "active" },
  { label: "Inativa", value: "inactive" },
] as const;

export function collectionSlugPreview(value: string) {
  return normalizeKey(value).slice(0, SLUG_MAX_LENGTH);
}

export function CollectionEditorModal({
  collection,
  isSaving,
  submitError,
  onClose,
  onSave,
}: Readonly<{
  collection: AdminCollection | null;
  isSaving: boolean;
  submitError?: string;
  onClose: () => void;
  onSave: (values: CollectionFormValues) => void | Promise<boolean>;
}>) {
  const [name, setName] = useState(collection?.name ?? "");
  const slug = collection?.slug ?? "";
  const [imageAttachmentId, setImageAttachmentId] = useState(collection?.imageAttachmentId ?? 0);
  const [imageUrl, setImageUrl] = useState(collection?.imageUrl ?? "");
  const [imageChanged, setImageChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState(collection?.description ?? "");
  const [isActive, setIsActive] = useState(collection?.isActive ?? true);
  const [error, setError] = useState("");
  const temporaryMedia = useTemporaryAdminMedia();

  /**
   * O identificador é a chave estrangeira natural em
   * `wp_papelito_product_collection`: mudá-lo depois do primeiro vínculo exigiria
   * reescrever as associações, então o backend recusa e o campo trava aqui.
   */
  const isSlugLocked = Boolean(collection && collection.productCount.total > 0);
  const derivedSlug = collectionSlugPreview(slug.trim() || name);

  function handleSubmit() {
    if (!name.trim()) {
      setError("Informe o nome da coleção.");
      return;
    }

    if (!isSlugLocked && derivedSlug === "") {
      setError("O nome precisa gerar um identificador válido.");
      return;
    }

    setError("");
    const result = onSave({
      description: description.trim(),
      isActive,
      name: name.trim(),
      ...(imageChanged ? { imageAttachmentId: imageAttachmentId || null, imageUrl: imageUrl || null } : {}),
      slug: derivedSlug,
    });
    if (result instanceof Promise) {
      void result.then((saved) => {
        if (saved) temporaryMedia.commit([imageAttachmentId]);
      });
    }
  }

  async function handleImage(file: File) {
    setUploading(true);
    setError("");
    try {
      const payload = await uploadDirectFile<{ media?: { id: number; src: string } }>("media", file);
      if (!payload.media) throw new Error("Não foi possível enviar a imagem.");
      const previousId = imageAttachmentId;
      temporaryMedia.track(payload.media.id);
      setImageAttachmentId(payload.media.id);
      setImageUrl(payload.media.src);
      setImageChanged(true);
      if (previousId && temporaryMedia.isTracked(previousId)) void temporaryMedia.discard([previousId]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      aria-labelledby="collection-editor-title"
      aria-modal="true"
      className="fixed inset-0 z-80 flex items-center justify-center bg-[#231f20]/70 p-4"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-auto border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#1a1a1a] p-5">
          <h3
            className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
            id="collection-editor-title"
          >
            {collection ? "Editar coleção" : "Nova coleção"}
          </h3>
          <button
            aria-label="Fechar"
            className="cursor-pointer border-2 border-[#1a1a1a] bg-white p-1.5 text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Nome *
            </span>
            <input
              autoFocus
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition focus:outline-2 focus:outline-brand-yellow"
              onChange={(event) => setName(event.target.value)}
              placeholder="ex: Edição Limitada"
              type="text"
              value={name}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Identificador
            </span>
            <input
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 font-mono text-sm text-[#1a1a1a] outline-none transition focus:outline-2 focus:outline-brand-yellow disabled:bg-[#efeade] disabled:text-[#231f20]/50"
              disabled={isSlugLocked}
              placeholder={collectionSlugPreview(name) || "edicao-limitada"}
              type="text"
              value={collection?.slug ?? derivedSlug}
              readOnly
            />
            <span className="text-[11px] font-semibold text-[#231f20]/60">
              {isSlugLocked
                ? "Bloqueado: a coleção já tem produtos e o identificador é a referência do vínculo."
                : `Gerado a partir do nome. Será gravado como “${derivedSlug || "—"}”.`}
            </span>
          </label>

          <div className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">Imagem da coleção</span>
            <div className="flex flex-wrap items-center gap-3 border-2 border-[#1a1a1a] bg-white p-3">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden border-2 border-[#1a1a1a] bg-[#efeade]">
                {imageUrl ? <img alt="Prévia da coleção" className="h-full w-full object-cover" src={imageUrl} /> : <ImageOff aria-hidden className="h-6 w-6 text-[#231f20]/45" />}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-brand-yellow px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] disabled:opacity-50">
                {uploading ? <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> : <ImagePlus aria-hidden className="h-4 w-4" />}
                {uploading ? "Enviando…" : imageUrl ? "Trocar imagem" : "Adicionar imagem"}
                <input accept="image/*" className="sr-only" disabled={uploading || isSaving} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImage(file); event.target.value = ""; }} type="file" />
              </label>
              {imageUrl ? <button className="inline-flex items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-[#efeade] disabled:cursor-not-allowed disabled:opacity-45" disabled={uploading || isSaving} onClick={() => { if (imageAttachmentId && temporaryMedia.isTracked(imageAttachmentId)) void temporaryMedia.discard([imageAttachmentId]); setImageAttachmentId(0); setImageUrl(""); setImageChanged(true); }} type="button"><ImageOff aria-hidden className="h-4 w-4" />Remover imagem</button> : null}
              <p className="basis-full text-[11px] font-semibold text-[#231f20]/60">Opcional. Sem imagem, os cards usam um espaço visual neutro.</p>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Descrição
            </span>
            <textarea
              className="w-full border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none transition focus:outline-2 focus:outline-brand-yellow"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Para que serve esta coleção. Aparece só no painel."
              rows={3}
              value={description}
            />
          </label>

          {/*
            * `anchoredMenu` porque a casca do modal rola: sem ele o menu ficaria
            * cortado no fim da área rolável, por baixo do rodapé de ações.
            */}
          <div className="grid gap-2">
            <AdminSelectField
              anchoredMenu
              label="Status"
              onChange={(value) => setIsActive(value === "active")}
              options={STATUS_OPTIONS}
              placeholder="Selecione o status"
              value={isActive ? "active" : "inactive"}
              variant="vendor-create"
            />
            <span className="text-[11px] font-semibold text-[#231f20]/60">
              Coleção inativa some do seletor do produto e da vitrine, mas mantém os vínculos
              que já existem.
            </span>
          </div>

          {error || submitError ? (
            <p className="text-sm font-semibold text-[#c0392b]" role="alert">
              ⚠ {error || submitError}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] p-5">
          <button
            className="cursor-pointer border-2 border-[#1a1a1a] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="cursor-pointer border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            disabled={isSaving || uploading}
            onClick={handleSubmit}
            type="button"
          >
            {isSaving ? "Salvando…" : collection ? "Salvar" : "Criar coleção"}
          </button>
        </div>
      </div>
    </div>
  );
}
