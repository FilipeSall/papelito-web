"use client";

import { useAdminProductsManager } from "@/hooks/use-admin-products-manager";
import type { AdminProductsSnapshot } from "@/lib/server/admin-products";

import { Panel } from "../../primitives";
import { ProductEditorModal } from "./components/product-editor-modal";
import { ProductsFilters } from "./components/products-filters";
import { ProductsList } from "./components/products-list";

export function ProductsManager({ snapshot }: { snapshot: AdminProductsSnapshot }) {
  const manager = useAdminProductsManager(snapshot);
  const {
    catalogSummary,
    categories,
    closeEditor,
    filters,
    isEditorOpen,
    isLoading,
    issues,
    loadProducts,
    notice,
    page,
    products,
    selectProduct,
    startNewProduct,
    totalPages,
    totalProducts,
    updateFilter,
  } = manager;

  return (
    <div className="space-y-4">
      <ProductsHeader />

      {(issues.length > 0 || notice) && (
        <div className="rounded-[12px] border border-[#231f20]/22 bg-[#fff8c5] px-4 py-3 text-sm font-medium text-[#231f20]">
          {[notice, ...issues].filter(Boolean).join(" ")}
        </div>
      )}

      <Panel className="relative z-30 overflow-visible bg-[#f8f3e8]">
        <ProductsFilters
          categories={categories}
          filters={filters}
          isLoading={isLoading}
          onCreateNew={startNewProduct}
          onSubmit={() => loadProducts(1)}
          onUpdateFilter={updateFilter}
        />

        <CatalogStats
          drafts={catalogSummary.drafts}
          page={page}
          published={catalogSummary.published}
          totalPages={totalPages}
          totalProducts={totalProducts}
        />
      </Panel>

      <ProductsList
        isLoading={isLoading}
        onChangePage={loadProducts}
        onSelectProduct={selectProduct}
        page={page}
        products={products}
        totalPages={totalPages}
      />

      {isEditorOpen ? (
        <ProductEditorModal
          categories={manager.categories}
          draft={manager.draft}
          handleCreateTag={manager.handleCreateTag}
          handleSave={manager.handleSave}
          handleUpload={manager.handleUpload}
          isCreatingTag={manager.isCreatingTag}
          isPromotionEnabled={manager.isPromotionEnabled}
          isSaving={manager.isSaving}
          isUploading={manager.isUploading}
          moveImageToCover={manager.moveImageToCover}
          newTagName={manager.newTagName}
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
  );
}

function ProductsHeader() {
  return (
    <section className="flex flex-col gap-3 border-b border-[#231f20]/18 pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#231f20]/64">
          <span>Papelito</span>
          <span aria-hidden className="text-[#231f20]/36">/</span>
          <span>Admin</span>
          <span aria-hidden className="text-[#231f20]/36">/</span>
          <span className="font-semibold text-[#231f20]">Produtos</span>
        </div>
        <h2
          className="mt-3 text-[2rem] font-semibold leading-none tracking-normal text-[#231f20]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          Produtos
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#231f20]/72">
          Catalogo, precos, imagens e caracteristicas da loja.
        </p>
      </div>
    </section>
  );
}

type CatalogStatsProps = {
  drafts: number;
  page: number;
  published: number;
  totalPages: number;
  totalProducts: number;
};

function CatalogStats({
  drafts,
  page,
  published,
  totalPages,
  totalProducts,
}: CatalogStatsProps) {
  const items = [
    { label: "Produtos", value: totalProducts },
    { label: "Pagina", value: `${page}/${Math.max(totalPages, 1)}` },
    { label: "Publicados na lista", value: published },
    { label: "Rascunhos", value: drafts },
  ];

  return (
    <div className="grid divide-y divide-[#d8d0bd] md:grid-cols-4 md:divide-x md:divide-y-0">
      {items.map((item) => (
        <div className="px-4 py-3" key={item.label}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a958d]">
            {item.label}
          </p>
          <p className="mt-1 text-xl font-semibold leading-none text-[#231f20]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
