import { describe, expect, it } from "vitest";

import { shouldHighlightWeightField } from "./helpers";

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
