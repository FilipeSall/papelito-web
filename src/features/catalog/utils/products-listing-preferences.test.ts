import { describe, expect, it } from "vitest";

import {
  getDefaultPerPageForView,
  getPerPageOptionsForView,
  normalizeProductsPerPage,
  normalizeProductsViewMode,
} from "./products-listing-preferences";

describe("normalizeProductsPerPage", () => {
  it("aceita os valores oferecidos pela visualização", () => {
    for (const option of getPerPageOptionsForView("grid")) {
      expect(normalizeProductsPerPage(String(option), "grid")).toBe(option);
    }

    for (const option of getPerPageOptionsForView("list")) {
      expect(normalizeProductsPerPage(String(option), "list")).toBe(option);
    }
  });

  it("recusa valor fora da allow-list da visualização (regressão: 18 sobrevivia no grid)", () => {
    expect(normalizeProductsPerPage("18", "grid")).toBe(getDefaultPerPageForView("grid"));
    expect(normalizeProductsPerPage("9", "list")).toBe(getDefaultPerPageForView("list"));
  });

  it("cai no default da visualização para ausente, inválido ou negativo", () => {
    for (const value of [undefined, "", "abc", "0", "-5", "7", "1000"]) {
      expect(normalizeProductsPerPage(value, "grid")).toBe(9);
      expect(normalizeProductsPerPage(value, "list")).toBe(18);
    }
  });

  it("as duas visualizações não compartilham opções", () => {
    const grid = getPerPageOptionsForView("grid");
    const list = getPerPageOptionsForView("list");

    expect(grid.some((option) => list.includes(option))).toBe(false);
  });
});

describe("normalizeProductsViewMode", () => {
  it("só 'list' vira lista; o resto é grade", () => {
    expect(normalizeProductsViewMode("list")).toBe("list");
    expect(normalizeProductsViewMode("grid")).toBe("grid");
    expect(normalizeProductsViewMode("lista")).toBe("grid");
    expect(normalizeProductsViewMode(undefined)).toBe("grid");
  });
});
