import { describe, expect, it } from "vitest";

import type { CheckoutShippingQuoteState, ShippingQuoteOption } from "../types/checkout";
import { resolveSelectedShipping } from "./resolve-selected-shipping";

const PAC: ShippingQuoteOption = {
  provider: "correios",
  optionKey: "correios:03298",
  serviceCode: "03298",
  code: "03298",
  service: "PAC",
  name: "PAC CONTRATO AG",
  price: 16.27,
  deliveryTime: 5,
  customerPriceCents: 1627,
  expiresAt: null,
  fingerprint: "pac-fingerprint",
};

const SEDEX: ShippingQuoteOption = {
  provider: "correios",
  optionKey: "correios:03220",
  serviceCode: "03220",
  code: "03220",
  service: "SEDEX",
  name: "SEDEX CONTRATO AG",
  price: 10.36,
  deliveryTime: 1,
  customerPriceCents: 1036,
  expiresAt: null,
  fingerprint: "sedex-fingerprint",
};

function state(overrides: Partial<CheckoutShippingQuoteState> = {}): CheckoutShippingQuoteState {
  return {
    quote: { originCep: "70000000", destinationCep: "71200100", vendorId: 10, options: [PAC, SEDEX] },
    selectedOption: PAC,
    ...overrides,
  };
}

describe("resolveSelectedShipping", () => {
  it("accepts a selection that belongs to the quote for the current address", () => {
    expect(resolveSelectedShipping(state(), "71200-100")).toEqual(PAC);
  });

  it("rehydrates a legacy Correios selection only when its current snapshot still matches", () => {
    const persistedLegacySelection = {
      ...PAC,
      provider: undefined,
      optionKey: undefined,
      serviceCode: undefined,
    };

    expect(
      resolveSelectedShipping(state({ selectedOption: persistedLegacySelection }), "71200-100"),
    ).toEqual(PAC);
  });

  it.each([
    ["key", { ...PAC, optionKey: "correios:03220" }],
    ["fingerprint", { ...PAC, fingerprint: "new-fingerprint" }],
    ["cents", { ...PAC, customerPriceCents: 1990 }],
    ["delivery time", { ...PAC, deliveryTime: 6 }],
    ["expiry", { ...PAC, expiresAt: "2026-09-16T00:00:00Z" }],
  ])("does not rehydrate a legacy selection when the live quote %s differs", (_field, liveOption) => {
    const persistedLegacySelection = {
      ...PAC,
      provider: undefined,
      optionKey: undefined,
      serviceCode: undefined,
    };
    const quote = {
      originCep: "70000000",
      destinationCep: "71200100",
      vendorId: 10,
      options: [liveOption, SEDEX],
    };

    expect(
      resolveSelectedShipping(state({ quote, selectedOption: persistedLegacySelection }), "71200-100"),
    ).toBeNull();
  });

  it("rejects a selection restored without any quote", () => {
    expect(resolveSelectedShipping(state({ quote: null }), "71200-100")).toBeNull();
  });

  it("rejects a selection quoted for a different address", () => {
    expect(resolveSelectedShipping(state(), "01310-100")).toBeNull();
  });

  it("rejects a selection that the new quote no longer offers", () => {
    const withoutPac = state({
      quote: { originCep: "70000000", destinationCep: "71200100", vendorId: 10, options: [SEDEX] },
    });

    expect(resolveSelectedShipping(withoutPac, "71200-100")).toBeNull();
  });

  it("rejects a selection whose price changed in the new quote", () => {
    const repriced = state({
      quote: {
        originCep: "70000000",
        destinationCep: "71200100",
        vendorId: 10,
        options: [{ ...PAC, price: 19.9 }, SEDEX],
      },
    });

    expect(resolveSelectedShipping(repriced, "71200-100")).toBeNull();
  });

  it("rejects a selection whose integrity snapshot changed", () => {
    const revalidated = state({
      quote: {
        originCep: "70000000",
        destinationCep: "71200100",
        vendorId: 10,
        options: [{ ...PAC, fingerprint: "new-fingerprint", customerPriceCents: 1990 }, SEDEX],
      },
    });

    expect(resolveSelectedShipping(revalidated, "71200-100")).toBeNull();
  });

  it("rejects anything while the address has no complete zip code", () => {
    expect(resolveSelectedShipping(state(), "712")).toBeNull();
  });
});
