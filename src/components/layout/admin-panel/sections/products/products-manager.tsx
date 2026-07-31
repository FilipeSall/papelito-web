"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAdminProductsManager } from "@/hooks/use-admin-products-manager";
import type { AdminProductsSnapshot } from "@/lib/server/admin-products";

import { AdminToast } from "../../primitives";
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
  initialFocusProductId = null,
}: {
  initialIssue?: "missing-weight" | "product-data-incomplete" | null;
  snapshot: AdminProductsSnapshot;
  initialFocusProductId?: number | null;
}) {
  const [toast, setToast] = useState<ToastState>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    catalogSummary,
    categories,
    closeEditor,
    filters,
    isEditorOpen,
    isLoading,
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
      <div className="space-y-5">
      <ProductsHeader />

      <CatalogStats
        page={page}
        promotions={catalogSummary.promotions}
        published={catalogSummary.published}
        totalPages={totalPages}
        totalProducts={totalProducts}
      />

      <section className="animate-admin-panel-enter relative z-30 overflow-visible rounded-[12px] border border-[#231f20]/18 bg-white p-4 text-[#231f20]">
        <div aria-hidden className="absolute left-0 top-0 h-1 w-full bg-[#231f20]/18" />
        <ProductsFilters
          appliedFilters={appliedFilters}
          categories={categories}
          filters={filters}
          isLoading={isLoading}
          onCreateNew={startNewProduct}
          onSubmit={() => loadProducts(1, filters)}
          onUpdateFilter={updateFilter}
        />
      </section>

      <ProductsList
        isLoading={isLoading}
        onChangePage={(nextPage) => loadProducts(nextPage, appliedFilters)}
        onSelectProduct={selectProduct}
        page={page}
        perPage={perPage}
        products={products}
        totalProducts={totalProducts}
        totalPages={totalPages}
      />

      {isEditorOpen ? (
        <ProductEditorModal
          categories={manager.categories}
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

function ProductsHeader() {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#6f6758]">
          <span>Papelito</span>
          <span aria-hidden className="text-[#b2aa98]">/</span>
          <span>Admin</span>
          <span aria-hidden className="text-[#b2aa98]">/</span>
          <span className="font-semibold text-[#231f20]">Produtos</span>
        </div>
        <h2
          className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          Produtos
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5e574c]">
          Catálogo, preços, imagens e campanhas comerciais da loja.
        </p>
      </div>
    </section>
  );
}

type CatalogStatsProps = {
  page: number;
  promotions: number;
  published: number;
  totalPages: number;
  totalProducts: number;
};

function CatalogStats({
  page,
  promotions,
  published,
  totalPages,
  totalProducts,
}: CatalogStatsProps) {
  const items = [
    { description: "total no WooCommerce", label: "Produtos", value: totalProducts },
    { description: "navegacao atual", label: "Página", value: `${page}/${Math.max(totalPages, 1)}` },
    { description: "visíveis no catálogo", label: "Publicados na lista", value: published },
    { description: "campanhas em vitrine", label: "Promoções ativas", value: promotions },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <section
          className="animate-admin-panel-enter relative min-h-27 overflow-hidden rounded-[12px] border border-[#231f20]/18 bg-white p-4 text-[#231f20]"
          key={item.label}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div aria-hidden className="absolute left-0 top-0 h-1 w-full bg-[#231f20]/18" />
          <p className="text-sm font-semibold text-[#231f20]/82">
            {item.label}
          </p>
          <p
            className="mt-3 text-[1.45rem] font-semibold leading-none tracking-normal text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {item.value}
          </p>
          <p className="mt-3 text-sm leading-5 text-[#231f20]/62">
            {item.description}
          </p>
        </section>
      ))}
    </div>
  );
}
