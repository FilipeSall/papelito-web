import { describe, expect, it } from "vitest";

import { shippingProviderLabel, shippingProviderWithArticle } from "./shipping-provider-label";

describe("shippingProviderLabel", () => {
  it("names each transportadora the way the customer knows it", () => {
    expect(shippingProviderLabel("correios")).toBe("Correios");
    expect(shippingProviderLabel("braspress")).toBe("Braspress");
  });

  it("falls back to Correios for a selection persisted before the multicarrier contract", () => {
    expect(shippingProviderLabel(undefined)).toBe("Correios");
  });
});

describe("shippingProviderWithArticle", () => {
  it("carries the article each transportadora needs, because Correios is plural and Braspress is not", () => {
    expect(shippingProviderWithArticle("correios")).toBe("os Correios");
    expect(shippingProviderWithArticle("braspress")).toBe("a Braspress");
  });

  it("falls back to Correios for a selection persisted before the multicarrier contract", () => {
    expect(shippingProviderWithArticle(undefined)).toBe("os Correios");
  });
});
