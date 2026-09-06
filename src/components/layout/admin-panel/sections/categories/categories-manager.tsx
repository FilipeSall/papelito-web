"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Trash2, XCircle } from "lucide-react";

import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { AdminCategory, AdminSubcategory, AdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";
import { messageFromError } from "@/utils/error-message";

import { CategoryEditorModal, type CategoryFormValues } from "./category-editor-modal";
import { SubcategoryEditorModal, type SubcategoryFormValues } from "./subcategory-editor-modal";

const FACET_ORDER = ["tipo", "material", "formato", "tamanho", "linha", "geral"];

function facetRank(facet: string) {
  const index = FACET_ORDER.indexOf(facet);
  return index === -1 ? FACET_ORDER.length : index;
}

type Notice = { text: string; tone: "error" | "success" } | null;

export function CategoriesManager({ snapshot }: Readonly<{ snapshot: AdminTaxonomySnapshot }>) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [categoryModal, setCategoryModal] = useState<AdminCategory | "new" | null>(null);
  const [subcategoryModal, setSubcategoryModal] = useState<{
    categoryId: number;
    categoryName: string;
    subcategory?: AdminSubcategory;
  } | null>(null);

  /**
   * O `notice` da página fica embaixo do modal (`fixed inset-0`) e some da
   * viewport quando a lista está rolada. Falha vinda de um modal aberto precisa
   * aparecer dentro dele, senão salvar parece não fazer nada.
   */
  const [modalError, setModalError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);

  const categories = useMemo(
    () =>
      [...snapshot.categories].sort(
        (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
      ),
    [snapshot.categories],
  );

  async function run(
    action: () => Promise<Response>,
    successText: string,
  ): Promise<{ ok: true } | { message: string; ok: false }> {
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
      return { ok: true };
    } catch (error) {
      const message = messageFromError(error, "Falha na ação.");
      setNotice({ text: `⚠ ${message}`, tone: "error" });
      return { message, ok: false };
    } finally {
      setIsBusy(false);
    }
  }

  function openCategoryModal(target: AdminCategory | "new" | null) {
    setModalError("");
    setCategoryModal(target);
  }

  function openSubcategoryModal(
    target: { categoryId: number; categoryName: string; subcategory?: AdminSubcategory } | null,
  ) {
    setModalError("");
    setSubcategoryModal(target);
  }

  function move(categoryId: number, direction: -1 | 1) {
    const index = categories.findIndex((category) => category.id === categoryId);
    const target = index + direction;

    if (index === -1 || target < 0 || target >= categories.length) {
      return;
    }

    const ordered = [...categories];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    void run(
      () =>
        fetch("/api/admin/categories/reorder", {
          body: JSON.stringify({ ids: ordered.map((category) => category.id) }),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        }),
      "Ordem atualizada.",
    );
  }

  async function saveCategory(values: CategoryFormValues) {
    const isNew = categoryModal === "new";
    const result = await run(
      () =>
        fetch(
          isNew
            ? "/api/admin/categories"
            : `/api/admin/categories/${(categoryModal as AdminCategory).id}`,
          {
            body: JSON.stringify(values),
            headers: { "Content-Type": "application/json" },
            method: isNew ? "POST" : "PUT",
          },
        ),
      isNew ? "Categoria criada." : "Categoria salva.",
    );

    if (result.ok) {
      openCategoryModal(null);
      return;
    }

    setModalError(result.message);
  }

  async function saveSubcategory(values: SubcategoryFormValues) {
    if (!subcategoryModal) {
      return;
    }

    const result = await run(
      () =>
        fetch(
          subcategoryModal.subcategory
            ? `/api/admin/subcategories/${subcategoryModal.subcategory.id}`
            : `/api/admin/categories/${subcategoryModal.categoryId}/subcategories`,
          {
          body: JSON.stringify(values),
          headers: { "Content-Type": "application/json" },
          method: subcategoryModal.subcategory ? "PUT" : "POST",
        },
        ),
      subcategoryModal.subcategory ? "Subcategoria salva." : "Subcategoria criada.",
    );

    if (result.ok) {
      openSubcategoryModal(null);
      return;
    }

    setModalError(result.message);
  }

  function moveSubcategory(category: AdminCategory, subcategoryId: number, direction: -1 | 1) {
    const ordered = [...category.subcategories].sort(
      (left, right) => left.sortOrder - right.sortOrder || left.id - right.id,
    );
    const index = ordered.findIndex((subcategory) => subcategory.id === subcategoryId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    void run(
      () => fetch(`/api/admin/categories/${category.id}/subcategories/reorder`, {
        body: JSON.stringify({ ids: ordered.map((subcategory) => subcategory.id) }),
        headers: { "Content-Type": "application/json" }, method: "PUT",
      }),
      "Ordem das subcategorias atualizada.",
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
              Categorias
            </h3>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[#231f20]/70">
            A classificação da Papelito. Um produto tem exatamente uma categoria principal e
            quantas subcategorias fizerem sentido.
          </p>
        </div>
        <button
          className="cursor-pointer border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy}
          onClick={() => openCategoryModal("new")}
          type="button"
        >
          <span className="flex items-center gap-2">
            <Plus aria-hidden className="h-4 w-4" />
            Nova categoria
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

      {categories.length === 0 ? (
        <p className="border-2 border-dashed border-[#1a1a1a] bg-[#faf8f2] px-4 py-10 text-center text-sm font-semibold uppercase tracking-[0.14em] text-[#231f20]/50">
          nenhuma categoria cadastrada
        </p>
      ) : (
        <ul className="space-y-4">
          {categories.map((category, index) => {
            const isArchived = !category.isActive || Boolean(category.archivedAt);
            const subcategories = [...category.subcategories].sort(
              (left, right) =>
                facetRank(left.facet) - facetRank(right.facet) ||
                left.sortOrder - right.sortOrder ||
                left.id - right.id,
            );

            return (
              <li
                className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
                key={category.id}
              >
                <div className="h-2 w-full bg-brand-yellow" />
                <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#1a1a1a] p-5">
                  <div className="min-w-0">
                    <h4 className="text-base font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                      {category.name}
                      {isArchived ? (
                        <span className="ml-2 border-2 border-[#c0392b] px-2 py-0.5 text-[10px] tracking-[0.14em] text-[#c0392b]">
                          arquivada
                        </span>
                      ) : null}
                    </h4>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/60">
                      /{category.slug} · {category.productCount.published} publicado(s) de{" "}
                      {category.productCount.total}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      aria-label={`Subir ${category.name}`}
                      className="cursor-pointer border-2 border-[#1a1a1a] bg-white p-2 text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={isBusy || index === 0}
                      onClick={() => move(category.id, -1)}
                      type="button"
                    >
                      <ChevronUp aria-hidden className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`Descer ${category.name}`}
                      className="cursor-pointer border-2 border-[#1a1a1a] bg-white p-2 text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-30"
                      disabled={isBusy || index === categories.length - 1}
                      onClick={() => move(category.id, 1)}
                      type="button"
                    >
                      <ChevronDown aria-hidden className="h-4 w-4" />
                    </button>
                    <button
                      className="cursor-pointer border-2 border-[#1a1a1a] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isBusy}
                      onClick={() => openCategoryModal(category)}
                      type="button"
                    >
                      Editar
                    </button>
                    {isArchived ? (
                      <>
                        <button
                          className="flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() =>
                            void run(
                              () =>
                                fetch(`/api/admin/categories/${category.id}/restore`, {
                                  method: "POST",
                                }),
                              "Categoria restaurada.",
                            )
                          }
                          type="button"
                        >
                          <RotateCcw aria-hidden className="h-4 w-4" />
                          Restaurar
                        </button>
                        <button
                          className="flex cursor-pointer items-center gap-2 border-2 border-[#c0392b] bg-[#c0392b] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-45"
                          disabled={isBusy}
                          onClick={() => setPendingDelete(category)}
                          type="button"
                        >
                          <XCircle aria-hidden className="h-4 w-4" />
                          Excluir
                        </button>
                      </>
                    ) : (
                      <button
                        className="flex cursor-pointer items-center gap-2 border-2 border-[#c0392b] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isBusy}
                        onClick={() =>
                          void run(
                            () =>
                              fetch(`/api/admin/categories/${category.id}`, {
                                method: "DELETE",
                              }),
                            "Categoria arquivada.",
                          )
                        }
                        type="button"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                        Arquivar
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {subcategories.length === 0 ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/50">
                      sem subcategorias
                    </p>
                  ) : (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {subcategories.map((subcategory) => {
                        const isSubArchived =
                          !subcategory.isActive || Boolean(subcategory.archivedAt);

                        return (
                          <li
                            className="flex items-center justify-between gap-3 border-2 border-[#1a1a1a] bg-white px-3 py-2"
                            key={subcategory.id}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-[#231f20]">
                                {subcategory.name}
                                {isSubArchived ? (
                                  <span className="ml-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#c0392b]">
                                    inativa
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                                {subcategory.facet} · {subcategory.productCount} produto(s)
                              </span>
                            </span>
                            <span className="flex shrink-0 gap-1">
                              <button aria-label={`Editar ${subcategory.name}`} className="cursor-pointer border-2 border-[#1a1a1a] p-1.5 transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40" disabled={isBusy || Boolean(subcategory.archivedAt)} onClick={() => openSubcategoryModal({ categoryId: category.id, categoryName: category.name, subcategory })} type="button"><Pencil aria-hidden className="h-3.5 w-3.5" /></button>
                              <button aria-label={`Subir ${subcategory.name}`} className="cursor-pointer border-2 border-[#1a1a1a] p-1.5 transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40" disabled={isBusy || subcategories.indexOf(subcategory) === 0} onClick={() => moveSubcategory(category, subcategory.id, -1)} type="button"><ChevronUp aria-hidden className="h-3.5 w-3.5" /></button>
                              <button aria-label={`Descer ${subcategory.name}`} className="cursor-pointer border-2 border-[#1a1a1a] p-1.5 transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-40" disabled={isBusy || subcategories.indexOf(subcategory) === subcategories.length - 1} onClick={() => moveSubcategory(category, subcategory.id, 1)} type="button"><ChevronDown aria-hidden className="h-3.5 w-3.5" /></button>
                              {!isSubArchived ? <button aria-label={`Arquivar ${subcategory.name}`} className="cursor-pointer border-2 border-[#c0392b] p-1.5 text-[#c0392b] transition hover:bg-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={isBusy} onClick={() => void run(() => fetch(`/api/admin/subcategories/${subcategory.id}`, { method: "DELETE" }), "Subcategoria arquivada.")} type="button"><Trash2 aria-hidden className="h-3.5 w-3.5" /></button> : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <button
                    className="w-full cursor-pointer border-2 border-dashed border-[#1a1a1a] px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() =>
                      openSubcategoryModal({
                        categoryId: category.id,
                        categoryName: category.name,
                      })
                    }
                    type="button"
                  >
                    + Nova subcategoria
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        confirmLabel="Excluir para sempre"
        description={
          pendingDelete
            ? `A categoria “${pendingDelete.name}”, suas ${pendingDelete.subcategories.length} subcategoria(s) e os vínculos serão apagados do banco. Não há como desfazer.`
            : ""
        }
        isSubmitting={isBusy}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;

          const target = pendingDelete;

          void run(
            () => fetch(`/api/admin/categories/${target.id}?force=true`, { method: "DELETE" }),
            "Categoria excluída em definitivo.",
          ).then((result) => {
            if (result.ok) setPendingDelete(null);
          });
        }}
        open={pendingDelete !== null}
        title="Excluir categoria"
        tone="danger"
      />

      {categoryModal ? (
        <CategoryEditorModal
          category={categoryModal === "new" ? null : categoryModal}
          isSaving={isBusy}
          onClose={() => openCategoryModal(null)}
          onSave={saveCategory}
          submitError={modalError}
        />
      ) : null}

      {subcategoryModal ? (
        <SubcategoryEditorModal
          categoryName={subcategoryModal.categoryName}
          isSaving={isBusy}
          onClose={() => openSubcategoryModal(null)}
          onSave={saveSubcategory}
          subcategory={subcategoryModal.subcategory}
          submitError={modalError}
        />
      ) : null}
    </div>
  );
}
