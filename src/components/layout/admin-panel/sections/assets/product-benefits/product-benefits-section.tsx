"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { RichTextResolutionContext } from "@/features/rich-text";
import type { AdminCategory } from "@/lib/server/admin-taxonomy";
import type {
  AdminBenefitGroup,
  AdminBenefitGroupsSnapshot,
} from "@/types/product-benefits";
import { messageFromError } from "@/utils/error-message";
import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";

import { uploadMedia } from "../upload-media";
import {
  GroupEditorModal,
  type BenefitGroupFormValues,
} from "./group-editor-modal";
import { ProductBenefitsPreview } from "./product-benefits-preview";

const GROUPS_API = "/api/admin/benefit-groups";

type Notice = { text: string; tone: "error" | "success" } | null;

function targetSummary(group: AdminBenefitGroup) {
  if (group.isGlobal) {
    return "Todos os produtos sem configuração específica";
  }

  const parts: string[] = [];

  if (group.targets.categories.length > 0) {
    parts.push(`${group.targets.categories.length} categoria(s)`);
  }

  if (group.targets.collections.length > 0) {
    parts.push(`coleções: ${group.targets.collections.join(", ")}`);
  }

  if (group.targets.products.length > 0) {
    parts.push(`${group.targets.products.length} produto(s)`);
  }

  return parts.length === 0 ? "Não aplicada a nada" : parts.join(" · ");
}

export function ProductBenefitsSection({
  categories,
  richTextContext,
  snapshot,
}: Readonly<{
  categories: AdminCategory[];
  richTextContext: RichTextResolutionContext;
  snapshot: AdminBenefitGroupsSnapshot;
}>) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [modal, setModal] = useState<AdminBenefitGroup | "new" | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminBenefitGroup | null>(
    null,
  );
  const editorSession = useRef(0);
  const uploadedIconIds = useRef(new Map<string, number>());
  const temporaryMedia = useTemporaryAdminMedia();

  useEffect(() => {
    return () => {
      editorSession.current += 1;
    };
  }, []);

  // Global primeiro: é o padrão de todo o catálogo e precisa ser o mais visível.
  const groups = useMemo(
    () =>
      [...snapshot.groups].sort(
        (left, right) =>
          Number(right.isGlobal) - Number(left.isGlobal) || left.id - right.id,
      ),
    [snapshot.groups],
  );

  async function run(action: () => Promise<Response>, successText: string) {
    setIsBusy(true);
    setNotice(null);

    try {
      const response = await action();
      const json = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Não foi possível concluir a ação.");
      }

      setNotice({ text: `✓ ${successText}`, tone: "success" });
      router.refresh();
      return true;
    } catch (error) {
      setNotice({
        text: `⚠ ${messageFromError(error, "Falha na ação.")}`,
        tone: "error",
      });
      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUploadIcon(key: string, file: File) {
    const session = editorSession.current;
    setUploadingKey(key);

    try {
      const media = await uploadMedia(file);

      if (session !== editorSession.current) {
        void temporaryMedia.discard([media.id]).catch(() => undefined);
        return null;
      }

      const previousId = uploadedIconIds.current.get(key);
      temporaryMedia.track(media.id);
      uploadedIconIds.current.set(key, media.id);

      if (previousId && temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId]).catch(() => undefined);
      }

      return media;
    } catch (error) {
      setNotice({
        text: `⚠ ${messageFromError(error, "Não foi possível enviar o ícone.")}`,
        tone: "error",
      });
      return null;
    } finally {
      setUploadingKey(null);
    }
  }

  async function save(values: BenefitGroupFormValues) {
    const isNew = modal === "new";
    const group = isNew ? null : (modal as AdminBenefitGroup);

    const body = JSON.stringify({
      isActive: values.isActive,
      name: values.name,
      targets: values.targets,
      items: values.items.map((item) => ({
        description: item.description,
        descriptionContent: item.descriptionContent,
        iconAttachmentId: item.iconAttachmentId,
        iconEmoji: item.iconEmoji,
        iconType: item.iconType,
        iconUrl: item.iconUrl,
        isActive: item.isActive,
        title: item.title,
      })),
    });

    const ok = await run(
      () =>
        fetch(isNew ? GROUPS_API : `${GROUPS_API}/${group?.id}`, {
          body,
          headers: { "Content-Type": "application/json" },
          method: isNew ? "POST" : "PUT",
        }),
      isNew ? "Configuração criada." : "Configuração salva.",
    );

    if (ok) {
      const persistedIds = values.items
        .map((item) => item.iconAttachmentId)
        .filter((id): id is number => Number.isInteger(id) && id > 0);
      void temporaryMedia.discardAllExcept(persistedIds).catch(() => undefined);
      uploadedIconIds.current.clear();
      setModal(null);
      editorSession.current += 1;
    }
  }

  function openModal(nextModal: AdminBenefitGroup | "new") {
    editorSession.current += 1;
    uploadedIconIds.current.clear();
    setModal(nextModal);
  }

  function closeModal() {
    editorSession.current += 1;
    uploadedIconIds.current.clear();
    setModal(null);
    void temporaryMedia.discardAllExcept().catch(() => undefined);
  }

  async function remove(group: AdminBenefitGroup) {
    const ok = await run(
      () => fetch(`${GROUPS_API}/${group.id}`, { method: "DELETE" }),
      "Configuração excluída.",
    );

    if (ok) {
      setConfirmDelete(null);
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
            Benefícios do produto
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#231f20]/70">
            A faixa exibida na página de produto. A prioridade é produto, coleção, categoria e,
            por último, a configuração global.
          </p>
        </div>
        <button
          className="cursor-pointer border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
          onClick={() => openModal("new")}
          type="button"
        >
          <span className="flex items-center gap-2">
            <Plus aria-hidden className="h-4 w-4" />
            Nova configuração
          </span>
        </button>
      </header>
      {snapshot.issues.length > 0 ? (
        <p className="border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-semibold text-[#c0392b]">
          ⚠ {snapshot.issues.join(" · ")}
        </p>
      ) : null}

      {notice ? (
        <output
          aria-live="polite"
          className={[
            "border-2 bg-white px-4 py-3 text-sm font-semibold",
            notice.tone === "error"
              ? "border-[#c0392b] text-[#c0392b]"
              : "border-[#1a1a1a] text-[#1a1a1a]",
          ].join(" ")}
        >
          {notice.text}
        </output>
      ) : null}

      <ul className="space-y-4">
        {groups.map((group) => {
          const activeItems = group.items.filter((item) => item.isActive);

          return (
            <li
              className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
              key={group.id}
            >
              <div className="h-2 w-full bg-brand-yellow" />
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#1a1a1a] p-5">
                <div className="min-w-0">
                  <h4 className="text-base font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                    {group.name}
                    {group.isGlobal ? (
                      <span className="ml-2 border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-0.5 text-[10px] tracking-[0.14em]">
                        global
                      </span>
                    ) : null}
                    {group.isActive ? null : (
                      <span className="ml-2 border-2 border-[#c0392b] px-2 py-0.5 text-[10px] tracking-[0.14em] text-[#c0392b]">
                        inativa
                      </span>
                    )}
                  </h4>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/60">
                    {activeItems.length} de {group.items.length} benefício(s)
                    ativo(s) · {targetSummary(group)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="cursor-pointer border-2 border-[#1a1a1a] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => openModal(group)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <Pencil aria-hidden className="h-4 w-4" />
                      Editar
                    </span>
                  </button>

                  {group.isGlobal ? null : (
                    <button
                      className="cursor-pointer border-2 border-[#b91c1c] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#b91c1c] transition hover:bg-[#b91c1c] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => setConfirmDelete(group)}
                      type="button"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 aria-hidden className="h-4 w-4" />
                        Excluir
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5">
                <ProductBenefitsPreview
                  items={group.items}
                  richTextContext={richTextContext}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {modal === null ? null : (
        <GroupEditorModal
          categories={categories}
          collections={snapshot.collections}
          group={modal === "new" ? null : modal}
          isSaving={isBusy}
          onClose={closeModal}
          onSave={save}
          onUploadIcon={handleUploadIcon}
          productNames={{}}
          richTextContext={richTextContext}
          uploadingKey={uploadingKey}
        />
      )}

      {confirmDelete === null ? null : (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#231f20]/70 p-4">
          <div className="w-full max-w-md border-2 border-[#1a1a1a] bg-[#faf8f2] p-5 shadow-[8px_8px_0px_#1a1a1a]">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Excluir configuração
            </h3>
            <p className="mt-3 text-sm text-[#231f20]/70">
              &quot;{confirmDelete.name}&quot; será removida. Os produtos que
              ela atendia voltam a usar a configuração global.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="cursor-pointer border-2 border-[#1a1a1a]/20 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] hover:border-[#1a1a1a]"
                disabled={isBusy}
                onClick={() => setConfirmDelete(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="cursor-pointer border-2 border-[#b91c1c] bg-[#b91c1c] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isBusy}
                onClick={() => void remove(confirmDelete)}
                type="button"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
