import { describe, expect, it } from "vitest";

import type { EventQuote } from "../types/quote";

import { normalizeStoredQuote } from "./normalize-stored-quote";

function storedQuote(shipping: Record<string, unknown>, totalCents: number): EventQuote {
  return {
    itemsCents: 100000,
    totalCents,
    shipping,
  } as unknown as EventQuote;
}

describe("normalizeStoredQuote", () => {
  it("completa a cotação antiga com frete cobrado", () => {
    const quote = normalizeStoredQuote(storedQuote({ optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5 }, 102990));

    expect(quote?.shipping).toMatchObject({ discountCents: 0, waived: false, volumes: 0 });
  });

  it("tira o desconto do total já abatido de uma cotação antiga com frete grátis", () => {
    const quote = normalizeStoredQuote(storedQuote({ optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5 }, 100000));

    expect(quote?.shipping.discountCents).toBe(2990);
  });

  it("mantém a cotação nova como veio", () => {
    const shipping = { optionKey: "correios:pac", name: "PAC", priceCents: 2990, discountCents: 0, deliveryTime: 5, waived: false, volumes: 2 };

    expect(normalizeStoredQuote(storedQuote(shipping, 102990))?.shipping).toEqual(shipping);
  });

  it("deixa a ausência de cotação como está", () => {
    expect(normalizeStoredQuote(null)).toBeNull();
  });
});
