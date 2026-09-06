import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { newProductDraft } from "../helpers";
import { ProductEditorModal } from "./product-editor-modal";

describe("ProductEditorModal", () => {
  it("disables save while a tag is being created", () => {
    render(
      <ProductEditorModal
        draft={newProductDraft()}
        handleCreateTag={vi.fn()}
        handleSave={vi.fn()}
        handleUpload={vi.fn()}
        isCreatingTag
        isPromotionEnabled={false}
        isSaving={false}
        isTaxonomyLoading={false}
        isUploading={false}
        moveImageToCover={vi.fn()}
        newTagName="teste"
        notice=""
        onClose={vi.fn()}
        removeImage={vi.fn()}
        selectedProduct={null}
        selectedProductId="new"
        setNewTagName={vi.fn()}
        setTaxonomyCategory={vi.fn()}
        tags={[]}
        taxonomy={{ categories: [], collections: [], collectionsCatalog: [], issues: [], version: 0 }}
        toggleDraftTerm={vi.fn()}
        togglePromotion={vi.fn()}
        updateDraft={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Salvar Alterações" })).toBeDisabled();
  });

  it("disables the SKU field for product editing", () => {
    render(
      <ProductEditorModal
        draft={{ ...newProductDraft(), sku: "PPL-011836" }}
        handleCreateTag={vi.fn()}
        handleSave={vi.fn()}
        handleUpload={vi.fn()}
        isCreatingTag={false}
        isPromotionEnabled={false}
        isSaving={false}
        isTaxonomyLoading={false}
        isUploading={false}
        moveImageToCover={vi.fn()}
        newTagName=""
        notice=""
        onClose={vi.fn()}
        removeImage={vi.fn()}
        selectedProduct={null}
        selectedProductId={11836}
        setNewTagName={vi.fn()}
        setTaxonomyCategory={vi.fn()}
        tags={[]}
        taxonomy={{ categories: [], collections: [], collectionsCatalog: [], issues: [], version: 0 }}
        toggleDraftTerm={vi.fn()}
        togglePromotion={vi.fn()}
        updateDraft={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("PPL-011836")).toBeDisabled();
  });
});
