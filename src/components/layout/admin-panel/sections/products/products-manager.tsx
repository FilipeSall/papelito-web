"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAdminProductsManager } from "@/hooks/use-admin-products-manager";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import type { AdminProductsSnapshot } from "@/lib/server/admin-products";
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

  return (
    <>
      <div className="space-y-4">
        <ProductsFilters
          appliedFilters={appliedFilters}
          categories={taxonomy.categories}
          filters={filters}
          isLoading={isLoading}
          onApply={(next) => void applyFilters(next)}
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
