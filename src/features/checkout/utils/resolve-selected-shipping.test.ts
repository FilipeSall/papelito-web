import { describe, expect, it } from "vitest";

import type { CheckoutShippingQuoteState, ShippingQuoteOption } from "../types/checkout";
import { resolveSelectedShipping } from "./resolve-selected-shipping";

const PAC: ShippingQuoteOption = {
  code: "03298",
  service: "PAC",
  name: "PAC CONTRATO AG",
  price: 16.27,
  deliveryTime: 5,
};

const SEDEX: ShippingQuoteOption = {
  code: "03220",
  service: "SEDEX",
  name: "SEDEX CONTRATO AG",
  price: 10.36,
  deliveryTime: 1,
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

  it("rejects anything while the address has no complete zip code", () => {
    expect(resolveSelectedShipping(state(), "712")).toBeNull();
  });
});
