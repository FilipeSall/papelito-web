"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAdminProductsManager } from "@/hooks/use-admin-products-manager";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type {
  AdminProductSkuBackfillSummary,
  AdminProductsSnapshot,
} from "@/lib/server/admin-products";
import type { AdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";

import { AdminToast, InlineAlert } from "../../primitives";
import { ProductEditorModal } from "./components/product-editor-modal";
import { ProductsFilters } from "./components/products-filters";
import { ProductsList } from "./components/products-list";

const TOAST_HIDE_DELAY_MS = 2600;
const TOAST_REMOVE_DELAY_MS = 2900;

type ToastState = {
  description: string;
  title: string;
  tone: "error" | "success";
} | null;

export function ProductsManager({
  initialIssue = null,
  snapshot,
  taxonomy,
  initialFocusProductId = null,
  excludedProductIds = [],
}: Readonly<{
  initialIssue?: "missing-weight" | "product-data-incomplete" | null;
  snapshot: AdminProductsSnapshot;
  taxonomy: AdminTaxonomySnapshot;
  initialFocusProductId?: number | null;
  excludedProductIds?: number[];
}>) {
  const [toast, setToast] = useState<ToastState>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [isBackfillingSkus, setIsBackfillingSkus] = useState(false);
  const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const toastEnterFrameRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (toastHideTimerRef.current) {
        clearTimeout(toastHideTimerRef.current);
      }
      if (toastRemoveTimerRef.current) {
        clearTimeout(toastRemoveTimerRef.current);
      }
      if (toastEnterFrameRef.current) {
        cancelAnimationFrame(toastEnterFrameRef.current);
      }
    };
  }, []);

  const showToast = useCallback((nextToast: NonNullable<ToastState>) => {
    setToastVisible(false);
    setToast(nextToast);

    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
    }
    if (toastRemoveTimerRef.current) {
      clearTimeout(toastRemoveTimerRef.current);
    }
    if (toastEnterFrameRef.current) {
      cancelAnimationFrame(toastEnterFrameRef.current);
    }

    toastEnterFrameRef.current = requestAnimationFrame(() => {
      setToastVisible(true);
    });

    toastHideTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, TOAST_HIDE_DELAY_MS);

    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_REMOVE_DELAY_MS);
  }, []);

  const manager = useAdminProductsManager(snapshot, {
    initialFocusProductId,
    excludedProductIds,
    taxonomy,
    onUploadError: (description) => {
      showToast({
        description,
        title: "Não foi possível enviar a imagem.",
        tone: "error",
      });
    },
  });
  const {
    appliedFilters,
    applyFilters,
    changePerPage,
    closeEditor,
    filters,
    isEditorOpen,
    isLoading,
    isOpeningProduct,
    loadProducts,
    page,
    perPage,
    products,
    selectProduct,
    startNewProduct,
    totalPages,
    totalProducts,
    updateFilter,
  } = manager;

  const dismissToast = useCallback(() => {
    if (toastHideTimerRef.current) {
      clearTimeout(toastHideTimerRef.current);
    }
    if (toastRemoveTimerRef.current) {
      clearTimeout(toastRemoveTimerRef.current);
    }

    setToastVisible(false);
    toastRemoveTimerRef.current = setTimeout(() => {
      setToast(null);
    }, TOAST_REMOVE_DELAY_MS - TOAST_HIDE_DELAY_MS);
  }, []);

  const handleProductSave = useCallback(async () => {
    const saved = await manager.handleSave();

    if (!saved) {
      return false;
    }

    showToast({
      description:
        "As alterações do produto foram aplicadas no catálogo administrativo e já estão prontas para nova revisão ou publicacao.",
      title: "Alterações salvas com sucesso.",
      tone: "success",
    });
    return true;
  }, [manager, showToast]);

  const handleBackfillSkus = useCallback(async () => {
    if (isBackfillingSkus) {
      return;
    }

    setIsBackfillingSkus(true);

    try {
      const previewResponse = await fetch("/api/admin/products/sku-backfill", {
        body: JSON.stringify({ batch: 100, dryRun: true }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const preview = (await previewResponse.json().catch(() => null)) as
        | AdminProductSkuBackfillSummary
        | { message?: string }
        | null;

      if (!previewResponse.ok || !preview || !("missing" in preview)) {
        throw new Error(
          preview && "message" in preview && preview.message
            ? preview.message
            : "Não foi possível verificar os SKUs ausentes.",
        );
      }

      if (preview.missing === 0) {
        showToast({
          description: "Todos os produtos e variações já possuem SKU.",
          title: "Nenhum SKU pendente.",
          tone: "success",
        });
        return;
      }

      const confirmed = window.confirm(
        `${preview.missing} item(ns) sem SKU serão preenchidos automaticamente. Deseja continuar?`,
      );
      if (!confirmed) {
        return;
      }

      const applyResponse = await fetch("/api/admin/products/sku-backfill", {
        body: JSON.stringify({ batch: 100, dryRun: false }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const applied = (await applyResponse.json().catch(() => null)) as
        | AdminProductSkuBackfillSummary
        | { message?: string }
        | null;

      if (!applyResponse.ok || !applied || !("generated" in applied)) {
        throw new Error(
          applied && "message" in applied && applied.message
            ? applied.message
            : "Não foi possível gerar os SKUs.",
        );
      }

      await manager.loadProducts(1, appliedFilters, perPage);
      showToast({
        description: `${applied.generated} SKU(s) foram gerados. Itens já preenchidos permaneceram inalterados.`,
        title: "SKUs atualizados.",
        tone: "success",
      });
    } catch (error) {
      showToast({
        description: error instanceof Error ? error.message : "Não foi possível gerar os SKUs.",
        title: "Falha ao gerar SKUs.",
        tone: "error",
      });
    } finally {
      setIsBackfillingSkus(false);
    }
  }, [appliedFilters, isBackfillingSkus, manager, perPage, showToast]);

  return (
    <>
      <div className="space-y-4">
        <ProductsFilters
          appliedFilters={appliedFilters}
          categories={taxonomy.categories}
          filters={filters}
          isBackfillingSkus={isBackfillingSkus}
          isLoading={isLoading}
          onApply={(next) => void applyFilters(next)}
          onBackfillSkus={() => void handleBackfillSkus()}
          onCreateNew={startNewProduct}
          onUpdateFilter={updateFilter}
        />

        {!isEditorOpen && manager.notice ? (
          <InlineAlert tone="critical">{manager.notice}</InlineAlert>
        ) : null}

        <ProductsList
          isLoading={isLoading}
          issues={manager.issues}
          onChangePage={(nextPage) => void loadProducts(nextPage, appliedFilters)}
          onChangePerPage={(nextPerPage) => void changePerPage(nextPerPage)}
          onSelectProduct={selectProduct}
          page={page}
          perPage={perPage}
          products={products}
          totalProducts={totalProducts}
          totalPages={totalPages}
        />

        {isOpeningProduct ? <LoadingOverlay /> : null}

        {isEditorOpen ? (
          <ProductEditorModal
            draft={manager.draft}
            forceWeightErrorHighlight={
              initialIssue === "missing-weight" &&
              typeof initialFocusProductId === "number" &&
              manager.selectedProductId === initialFocusProductId
            }
            handleCreateTag={manager.handleCreateTag}
            handleSave={handleProductSave}
            handleUpload={manager.handleUpload}
            isCreatingTag={manager.isCreatingTag}
            isTaxonomyLoading={manager.isTaxonomyLoading}
            setTaxonomyCategory={manager.setTaxonomyCategory}
            taxonomy={manager.taxonomy}
            isPromotionEnabled={manager.isPromotionEnabled}
            isSaving={manager.isSaving}
            isUploading={manager.isUploading}
            moveImageToCover={manager.moveImageToCover}
            newTagName={manager.newTagName}
            notice={manager.notice}
            onClose={closeEditor}
            removeImage={manager.removeImage}
            selectedProduct={manager.selectedProduct}
            selectedProductId={manager.selectedProductId}
            setNewTagName={manager.setNewTagName}
            tags={manager.tags}
            toggleDraftTerm={manager.toggleDraftTerm}
            togglePromotion={manager.togglePromotion}
            updateDraft={manager.updateDraft}
          />
        ) : null}
      </div>

      {toast ? (
        <AdminToast
          description={toast.description}
          onClose={dismissToast}
          title={toast.title}
          tone={toast.tone}
          visible={toastVisible}
        />
      ) : null}
    </>
  );
}
