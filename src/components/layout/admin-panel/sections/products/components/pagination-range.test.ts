import { describe, expect, it } from "vitest";

import { buildPaginationRange } from "./pagination-range";

describe("buildPaginationRange", () => {
  it("mostra todas as páginas quando cabem sem reticências", () => {
    expect(buildPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("abre reticências só no fim quando a atual está no começo", () => {
    expect(buildPaginationRange(2, 18)).toEqual([1, 2, 3, 4, 5, "gap-end", 18]);
  });

  it("abre reticências dos dois lados no miolo", () => {
    expect(buildPaginationRange(9, 18)).toEqual([
      1,
      "gap-start",
      8,
      9,
      10,
      "gap-end",
      18,
    ]);
  });

  it("abre reticências só no começo quando a atual está no fim", () => {
    expect(buildPaginationRange(17, 18)).toEqual([
      1,
      "gap-start",
      14,
      15,
      16,
      17,
      18,
    ]);
  });

  it("nunca passa de sete fatias", () => {
    for (let current = 1; current <= 40; current += 1) {
      expect(buildPaginationRange(current, 40).length).toBeLessThanOrEqual(7);
    }
  });

  it("mantém primeira e última visíveis em qualquer posição", () => {
    for (let current = 1; current <= 40; current += 1) {
      const slots = buildPaginationRange(current, 40);

      expect(slots[0]).toBe(1);
      expect(slots.at(-1)).toBe(40);
      expect(slots).toContain(current);
    }
  });

  it("não emite reticências que escondem uma página só", () => {
    for (let total = 1; total <= 30; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        const slots = buildPaginationRange(current, total);
        const numbers = slots.filter(
          (slot): slot is number => typeof slot === "number",
        );

        slots.forEach((slot, index) => {
          if (typeof slot === "number") {
            return;
          }

          const before = slots[index - 1];
          const after = slots[index + 1];

          expect(typeof before).toBe("number");
          expect(typeof after).toBe("number");
          expect(Number(after) - Number(before)).toBeGreaterThan(2);
        });

        expect(new Set(numbers).size).toBe(numbers.length);
      }
    }
  });

  it("normaliza entrada inválida em vez de quebrar", () => {
    expect(buildPaginationRange(0, 0)).toEqual([1]);
    expect(buildPaginationRange(99, 3)).toEqual([1, 2, 3]);
    expect(buildPaginationRange(Number.NaN, 4)).toEqual([1, 2, 3, 4]);
  });
});
