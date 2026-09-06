"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  EyeOff,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { AdminCollection } from "@/lib/server/admin-taxonomy";
import { messageFromError } from "@/utils/error-message";
import {
  EmptyResult,
  InlineAlert,
  PrimaryButton,
  ResultButtonRow,
  ResultFrame,
  SectionHeading,
  StatusChip,
  type StatusShape,
} from "@/components/layout/admin-panel/primitives";

import { CollectionEditorModal, type CollectionFormValues } from "./collection-editor-modal";

const ICON_BUTTON_CLASS =
  "cursor-pointer border-2 border-[#1a1a1a] bg-white p-2 text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-30";

const TEXT_BUTTON_CLASS =
  "flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45";

function statusOf(collection: AdminCollection): StatusShape {
  if (collection.archivedAt) {
    return { icon: Archive, label: "Arquivada", tone: "neutral" };
  }

  return collection.isActive
    ? { icon: CircleCheck, label: "Ativa", tone: "positive" }
    : { icon: EyeOff, label: "Inativa", tone: "pending" };
}

type Notice = { text: string; tone: "error" | "success" } | null;

/**
 * Catálogo de coleções manuais.
 *
 * Coleção não é `product_tag`: a associação com o produto acontece no editor do
 * produto e vive em `wp_papelito_product_collection`. Esta tela administra o
 * catálogo, nunca a lista de produtos de uma coleção — por isso não existe aqui
 * nenhum seletor de produto.
 */
export function CuratedCollectionsPanel({
  collections,
  issues,
}: Readonly<{ collections: AdminCollection[]; issues: string[] }>) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [modal, setModal] = useState<AdminCollection | "new" | null>(null);
  const [modalError, setModalError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminCollection | null>(null);

  const ordered = useMemo(
    () => [...collections].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id),
    [collections],
  );

  const totalLinked = useMemo(
    () => ordered.reduce((sum, collection) => sum + collection.productCount.total, 0),
    [ordered],
  );

  async function run(action: () => Promise<Response>, successText: string) {
    setIsBusy(true);
    setNotice(null);

    try {
      const response = await action();
      const json = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Não foi possível concluir a ação.");
      }

      setNotice({ text: `✓ ${successText}`, tone: "success" });
      router.refresh();
      return { ok: true as const };
    } catch (error) {
      const message = messageFromError(error, "Falha na ação.");
      setNotice({ text: `⚠ ${message}`, tone: "error" });
      return { message, ok: false as const };
    } finally {
      setIsBusy(false);
    }
  }

  function openModal(target: AdminCollection | "new" | null) {
    setModalError("");
    setModal(target);
  }

  async function save(values: CollectionFormValues) {
    const isNew = modal === "new";
    const result = await run(
      () =>
        fetch(isNew ? "/api/admin/collections" : `/api/admin/collections/${(modal as AdminCollection).id}`, {
          body: JSON.stringify(values),
          headers: { "Content-Type": "application/json" },
          method: isNew ? "POST" : "PUT",
        }),
      isNew ? "Coleção criada." : "Coleção salva.",
    );

    if (result.ok) {
      openModal(null);
      return;
    }

    setModalError(result.message);
  }

  function move(collectionId: number, direction: -1 | 1) {
    const index = ordered.findIndex((collection) => collection.id === collectionId);
    const target = index + direction;

    if (index === -1 || target < 0 || target >= ordered.length) {
      return;
    }

    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];

    void run(
      () =>
        fetch("/api/admin/collections/reorder", {
          body: JSON.stringify({ ids: next.map((collection) => collection.id) }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }),
      "Ordem atualizada.",
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        action={
          <PrimaryButton disabled={isBusy} onClick={() => openModal("new")}>
            <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            Nova coleção
          </PrimaryButton>
        }
        description="Recortes editoriais que atravessam a categoria. O produto entra e sai pela seleção da coleção no próprio produto — não há cadastro de produto aqui."
        title="Coleções manuais"
      />

      {issues.length > 0 ? <InlineAlert tone="critical">{issues.join(" · ")}</InlineAlert> : null}

      {notice ? (
        <output aria-live="polite" className="block">
          <InlineAlert tone={notice.tone === "error" ? "critical" : "warning"}>
            {notice.text}
          </InlineAlert>
        </output>
      ) : null}

      {ordered.length === 0 ? (
        <EmptyResult
          body="Crie a primeira coleção para que ela apareça no seletor do editor de produto."
          title="Nenhuma coleção cadastrada"
        />
      ) : (
        <ResultFrame
          summary={`${ordered.length} ${ordered.length === 1 ? "coleção" : "coleções"} · ${totalLinked} ${totalLinked === 1 ? "produto associado" : "produtos associados"}`}
        >
          {ordered.map((collection, index) => {
            const status = statusOf(collection);
            const isArchived = Boolean(collection.archivedAt);

            return (
              <ResultButtonRow
                // A linha inteira abre o editor, e o lápis é a affordance visível.
                // Dois controles com o mesmo nome acessível soariam como o mesmo
                // botão repetido para quem navega por leitor de tela.
                ariaLabel={`Abrir ${collection.name}`}
                key={collection.id}
                lead={
                  /*
                   * Identificador e contagem moram no lead, não numa coluna `meta`.
                   * A 1024px a sidebar leva 292px e as três colunas do ResultRow
                   * disputavam a mesma linha: o nome colapsava para zero.
                   */
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                      {collection.name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/60">
                      <span className="truncate font-mono text-[11px] normal-case tracking-normal">
                        {collection.slug}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Package aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                        <span data-numeric>
                          {collection.productCount.published} de {collection.productCount.total}
                        </span>
                        publicados
                      </span>
                    </p>
                  </div>
                }
                onOpen={() => openModal(collection)}
                trailing={
                  <>
                    <StatusChip icon={status.icon} label={status.label} tone={status.tone} />
                    <span className="flex gap-1">
                      <button
                        aria-label={`Subir ${collection.name}`}
                        className={ICON_BUTTON_CLASS}
                        disabled={isBusy || index === 0}
                        onClick={() => move(collection.id, -1)}
                        type="button"
                      >
                        <ChevronUp aria-hidden className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Descer ${collection.name}`}
                        className={ICON_BUTTON_CLASS}
                        disabled={isBusy || index === ordered.length - 1}
                        onClick={() => move(collection.id, 1)}
                        type="button"
                      >
                        <ChevronDown aria-hidden className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`Editar ${collection.name}`}
                        className={ICON_BUTTON_CLASS}
                        disabled={isBusy}
                        onClick={() => openModal(collection)}
                        type="button"
                      >
                        <Pencil aria-hidden className="h-4 w-4" />
                      </button>
                    </span>
                    {isArchived ? (
                      <>
                        <button
                          className={TEXT_BUTTON_CLASS}
                          disabled={isBusy}
                          onClick={() =>
                            void run(
                              () =>
                                fetch(`/api/admin/collections/${collection.id}/restore`, {
                                  method: "POST",
                                }),
                              "Coleção restaurada.",
                            )
                          }
                          type="button"
                        >
                          <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                          Restaurar
                        </button>
                        <button
                          className="flex cursor-pointer items-center gap-2 border-2 border-[#c0392b] bg-[#c0392b] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-45"
                          disabled={isBusy}
                          onClick={() => setPendingDelete(collection)}
                          type="button"
                        >
                          <Trash2 aria-hidden className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </>
                    ) : (
                      <button
                        className="flex cursor-pointer items-center gap-2 border-2 border-[#c0392b] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                        disabled={isBusy}
                        onClick={() =>
                          void run(
                            () =>
                              fetch(`/api/admin/collections/${collection.id}`, {
                                method: "DELETE",
                              }),
                            "Coleção arquivada. Os vínculos foram preservados.",
                          )
                        }
                        type="button"
                      >
                        <Archive aria-hidden className="h-3.5 w-3.5" />
                        Arquivar
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </ResultFrame>
      )}

      <ConfirmModal
        confirmLabel="Excluir para sempre"
        description={
          pendingDelete
            ? `A coleção “${pendingDelete.name}” e ${pendingDelete.productCount.total === 1 ? "o vínculo com 1 produto" : `os vínculos com ${pendingDelete.productCount.total} produtos`} serão apagados do banco. Os produtos continuam existindo; só deixam de pertencer a esta coleção. Não há como desfazer.`
            : ""
        }
        isSubmitting={isBusy}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;

          const target = pendingDelete;

          void run(
            () => fetch(`/api/admin/collections/${target.id}?force=true`, { method: "DELETE" }),
            "Coleção excluída em definitivo.",
          ).then((result) => {
            if (result.ok) setPendingDelete(null);
          });
        }}
        open={pendingDelete !== null}
        title="Excluir coleção"
        tone="danger"
      />

      {modal ? (
        <CollectionEditorModal
          collection={modal === "new" ? null : modal}
          isSaving={isBusy}
          onClose={() => openModal(null)}
          onSave={save}
          submitError={modalError}
        />
      ) : null}
    </div>
  );
}
