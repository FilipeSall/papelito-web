import { describe, expect, it } from "vitest";

import {
  applyTaxonomyToDraft,
  buildPayload,
  buildTaxonomyPayload,
  hasValidProductPrice,
  newProductDraft,
  normalizeProductPrice,
  normalizeShippingMeasure,
  shouldHighlightPriceField,
  shouldHighlightWeightField,
} from "./helpers";

describe("shouldHighlightWeightField", () => {
  it("highlights a published product without weight when opened directly", () => {
    expect(
      shouldHighlightWeightField({
        selectedProduct: { status: "publish" } as never,
        selectedProductId: 321,
        weight: "",
      }),
    ).toBe(true);
  });

  it("keeps a valid weight field clean even with notification highlight", () => {
    expect(
      shouldHighlightWeightField({
        forceHighlight: true,
        selectedProduct: { status: "publish" } as never,
        selectedProductId: 321,
        weight: "0.4",
      }),
    ).toBe(false);
  });

  it("does not highlight new drafts without weight", () => {
    expect(
      shouldHighlightWeightField({
        selectedProduct: null,
        selectedProductId: "new",
        weight: "",
      }),
    ).toBe(false);
  });
});

describe("pricing and shipping draft values", () => {
  it("marks empty and invalid prices as errors, then clears the error for a valid price", () => {
    expect(shouldHighlightPriceField("")).toBe(true);
    expect(shouldHighlightPriceField("sem preço")).toBe(true);
    expect(hasValidProductPrice("12,50")).toBe(true);
    expect(shouldHighlightPriceField("12,50")).toBe(false);
    expect(normalizeProductPrice("R$ 1.234,50")).toBe("1234.50");
  });

  it("normalizes valid measures and clears zero, empty and invalid values", () => {
    expect(normalizeShippingMeasure("5,5")).toBe("5.5");
    expect(normalizeShippingMeasure("0")).toBe("");
    expect(normalizeShippingMeasure("")).toBe("");
    expect(normalizeShippingMeasure(null)).toBe("");
    expect(normalizeShippingMeasure("cinco")).toBe("");
  });

  it("sends canonical numeric dimensions in the first save payload", () => {
    const payload = buildPayload({
      dateOnSaleFrom: "",
      dateOnSaleTo: "",
      description: "",
      height: "5",
      imageIds: [],
      images: [],
      length: "5,5",
      name: "Produto",
      regularPrice: "10,00",
      salePrice: "",
      shortDescription: "",
      sku: "",
      slug: "",
      status: "publish",
      tagIds: [],
      taxonomyCategoryId: "",
      taxonomyCollections: [],
      taxonomySubcategoryIds: [],
      weight: "0,4",
      width: "5",
    });

    expect(payload.dimensions).toEqual({ height: "5", length: "5.5", width: "5" });
    expect(payload.weight).toBe("0.4");
  });

  it("keeps unrelated fields out of a partial update", () => {
    const draft = {
      dateOnSaleFrom: "",
      dateOnSaleTo: "",
      description: "Descrição",
      height: "4",
      imageIds: ["8"],
      images: [],
      length: "3",
      name: "Produto",
      regularPrice: "140",
      salePrice: "120",
      shortDescription: "Resumo",
      sku: "SKU-11856",
      slug: "produto",
      status: "publish",
      tagIds: ["215"],
      taxonomyCategoryId: "",
      taxonomyCollections: [],
      taxonomySubcategoryIds: [],
      weight: "0.4",
      width: "2",
    };

    expect(buildPayload(draft, new Set(["sku", "weight"]))).toEqual({
      sku: "SKU-11856",
      weight: "0.4",
    });

    expect(
      buildPayload(
        draft,
        new Set([
          "description",
          "height",
          "imageIds",
          "length",
          "shortDescription",
          "slug",
          "status",
          "tagIds",
          "width",
        ]),
      ),
    ).toEqual({
      description: "Descrição",
      dimensions: { height: "4", length: "3", width: "2" },
      images: [8],
      shortDescription: "Resumo",
      slug: "produto",
      status: "publish",
      tags: [215],
    });
  });

  it("nunca envia `categories` ao WooCommerce", () => {
    const draft = {
      ...newProductDraft(),
      name: "Produto",
      taxonomyCategoryId: "3",
      taxonomySubcategoryIds: ["11"],
    };

    // Quem escreve `product_cat` é o dual-write no WordPress, a partir da
    // taxonomia Papelito. Dois writers para o mesmo dado é como a classificação
    // dessincroniza.
    expect(buildPayload(draft)).not.toHaveProperty("categories");
    expect(buildPayload(draft, new Set(["name"]))).toEqual({ name: "Produto" });
  });

  it("monta o payload da taxonomia Papelito separado do produto", () => {
    const draft = {
      ...newProductDraft(),
      taxonomyCategoryId: "3",
      taxonomyCollections: ["premium"],
      taxonomySubcategoryIds: ["11", "12"],
    };

    expect(buildTaxonomyPayload(draft)).toEqual({
      categoryId: 3,
      collections: ["premium"],
      subcategoryIds: [11, 12],
    });
  });

  it("aplica a taxonomia carregada à parte sobre o rascunho", () => {
    const draft = newProductDraft();

    expect(applyTaxonomyToDraft(draft, null)).toBe(draft);

    expect(
      applyTaxonomyToDraft(draft, {
        category: { id: 3 },
        collections: ["kits"],
        subcategories: [{ id: 11 }, { id: 12 }],
      }),
    ).toMatchObject({
      taxonomyCategoryId: "3",
      taxonomyCollections: ["kits"],
      taxonomySubcategoryIds: ["11", "12"],
    });
  });
});
