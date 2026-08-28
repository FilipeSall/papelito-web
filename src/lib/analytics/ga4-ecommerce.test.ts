import { describe, expect, it } from "vitest";

import {
  centsToAmount,
  sumItemsValue,
  toAmount,
  toGa4Item,
} from "./ga4-ecommerce";

describe("toAmount", () => {
  it("arredonda para duas casas", () => {
    expect(toAmount(129.899999)).toBe(129.9);
    expect(toAmount(0.1 + 0.2)).toBe(0.3);
  });

  it("devolve zero para valor não finito em vez de vazar NaN", () => {
    expect(toAmount(Number.NaN)).toBe(0);
    expect(toAmount(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("centsToAmount", () => {
  it("converte centavos do checkout para reais", () => {
    expect(centsToAmount(12990)).toBe(129.9);
    expect(centsToAmount(1)).toBe(0.01);
    expect(centsToAmount(0)).toBe(0);
  });
});

describe("toGa4Item", () => {
  it("normaliza id, quantidade e preço", () => {
    expect(
      toGa4Item({ id: 42, name: "Seda King Size", price: 12.3456, quantity: 2 }),
    ).toEqual({
      item_id: "42",
      item_name: "Seda King Size",
      price: 12.35,
      quantity: 2,
    });
  });

  it("assume quantidade mínima de um", () => {
    expect(toGa4Item({ id: "1", name: "Piteira", price: 5 }).quantity).toBe(1);
    expect(
      toGa4Item({ id: "1", name: "Piteira", price: 5, quantity: 0 }).quantity,
    ).toBe(1);
  });

  it("só envia categoria quando ela existe de fato", () => {
    expect(
      toGa4Item({ id: "1", name: "Piteira", price: 5, category: "  " }),
    ).not.toHaveProperty("item_category");
    expect(
      toGa4Item({ id: "1", name: "Piteira", price: 5, category: " Filtros " }),
    ).toHaveProperty("item_category", "Filtros");
  });
});

describe("sumItemsValue", () => {
  it("soma preço vezes quantidade de todos os itens", () => {
    expect(
      sumItemsValue([
        { item_id: "1", item_name: "A", price: 10.5, quantity: 2 },
        { item_id: "2", item_name: "B", price: 3.25, quantity: 4 },
      ]),
    ).toBe(34);
  });

  it("devolve zero para carrinho vazio", () => {
    expect(sumItemsValue([])).toBe(0);
  });
});
