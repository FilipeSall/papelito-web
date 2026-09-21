import { describe, expect, it } from "vitest";

import type { ShippingProvider } from "@/features/checkout/types/checkout";

import { resolveShippingProvider, SHIPPING_PROVIDERS } from "./resolve-shipping-provider";

describe("resolveShippingProvider", () => {
  it("keeps the two transportadoras the marketplace quotes", () => {
    expect(resolveShippingProvider("correios")).toBe("correios");
    expect(resolveShippingProvider("braspress")).toBe("braspress");
  });

  it("reads a shipment registered by hand as Correios, because the S10 is a Correios code", () => {
    expect(resolveShippingProvider("manual")).toBe("correios");
    expect(resolveShippingProvider("mock")).toBe("correios");
  });

  it("reads a record written before the multicarrier contract as Correios", () => {
    expect(resolveShippingProvider("")).toBe("correios");
    expect(resolveShippingProvider(undefined)).toBe("correios");
  });

  it("aceita a transportadora que o contrato conhece, sem depender de um par fixo", () => {
    for (const provider of Object.keys(SHIPPING_PROVIDERS) as ShippingProvider[]) {
      expect(resolveShippingProvider(provider)).toBe(provider);
    }
  });
});
