import { describe, expect, it } from "vitest";

import {
  buildPayload,
  hasValidProductPrice,
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
      categoryIds: [],
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
      weight: "0,4",
      width: "5",
    });

    expect(payload.dimensions).toEqual({ height: "5", length: "5.5", width: "5" });
    expect(payload.weight).toBe("0.4");
  });
});
