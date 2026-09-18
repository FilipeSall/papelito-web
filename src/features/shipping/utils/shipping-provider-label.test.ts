import { describe, expect, it } from "vitest";

import { shippingProviderLabel } from "./shipping-provider-label";

describe("shippingProviderLabel", () => {
  it("names each transportadora the way the customer knows it", () => {
    expect(shippingProviderLabel("correios")).toBe("Correios");
    expect(shippingProviderLabel("braspress")).toBe("Braspress");
  });

  it("falls back to Correios for a selection persisted before the multicarrier contract", () => {
    expect(shippingProviderLabel(undefined)).toBe("Correios");
  });
});
