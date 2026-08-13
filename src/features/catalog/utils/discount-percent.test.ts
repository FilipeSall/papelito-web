import { describe, expect, it } from "vitest";

import { calculateDiscountPercent } from "./discount-percent";

describe("calculateDiscountPercent", () => {
  it("calcula o percentual arredondado", () => {
    expect(calculateDiscountPercent(100, 75)).toBe(25);
    expect(calculateDiscountPercent(10, 9)).toBe(10);
    expect(calculateDiscountPercent(29.9, 19.9)).toBe(33);
  });

  it("devolve 0 sem desconto", () => {
    expect(calculateDiscountPercent(100, 100)).toBe(0);
    expect(calculateDiscountPercent(100, 120)).toBe(0);
  });

  it("devolve 0 para preço cheio ausente ou inválido", () => {
    expect(calculateDiscountPercent(0, 10)).toBe(0);
    expect(calculateDiscountPercent(Number.NaN, 10)).toBe(0);
    expect(calculateDiscountPercent(100, Number.NaN)).toBe(0);
  });
});
