import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { newProductDraft } from "../helpers";
import { ProductEditorModal } from "./product-editor-modal";

describe("ProductEditorModal", () => {
  it("disables save while a tag is being created", () => {
    render(
      <ProductEditorModal
        categories={[]}
        draft={newProductDraft()}
        handleCreateTag={vi.fn()}
        handleSave={vi.fn()}
        handleUpload={vi.fn()}
        isCreatingTag
        isPromotionEnabled={false}
        isSaving={false}
        isUploading={false}
        moveImageToCover={vi.fn()}
        newTagName="teste"
        notice=""
        onClose={vi.fn()}
        removeImage={vi.fn()}
        selectedProduct={null}
        selectedProductId="new"
        setNewTagName={vi.fn()}
        tags={[]}
        toggleDraftTerm={vi.fn()}
        togglePromotion={vi.fn()}
        updateDraft={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Salvar Alterações" })).toBeDisabled();
  });
});
