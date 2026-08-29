import { describe, expect, it } from "vitest";

import {
  getDefaultPerPageForView,
  isPerPageOptionEnabled,
  getPerPageOptionsForView,
  normalizeProductsPerPage,
  normalizeProductsViewMode,
  resolveProductsGridLayout,
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

describe("resolveProductsGridLayout", () => {
  it("só a coleção específica na variante de coleção usa o grid de 4 colunas", () => {
    expect(resolveProductsGridLayout("collection", "promocoes")).toBe("collection");
    expect(resolveProductsGridLayout("collection", "kits")).toBe("collection");
  });

  it("'todos' e a listagem geral seguem no layout padrão", () => {
    expect(resolveProductsGridLayout("collection", "todos")).toBe("default");
    expect(resolveProductsGridLayout("default", "todos")).toBe("default");
    expect(resolveProductsGridLayout("default", "promocoes")).toBe("default");
  });
});

describe("perPage do grid de coleção", () => {
  it("oferece múltiplos das 4 colunas", () => {
    expect(getPerPageOptionsForView("grid", "collection")).toEqual([12, 16, 20]);

    for (const option of getPerPageOptionsForView("grid", "collection")) {
      expect(option % 4).toBe(0);
    }
  });

  it("recusa o 9 herdado do grid de 3 colunas (regressão: última linha com 1 produto)", () => {
    expect(normalizeProductsPerPage("9", "grid", "collection")).toBe(12);
    expect(getDefaultPerPageForView("grid", "collection")).toBe(12);
  });

  it("não muda a listagem geral nem a coleção 'todos'", () => {
    expect(getPerPageOptionsForView("grid")).toEqual([9, 12, 15]);
    expect(getPerPageOptionsForView("grid", "default")).toEqual([9, 12, 15]);
    expect(getDefaultPerPageForView("grid", "default")).toBe(9);
    expect(normalizeProductsPerPage("9", "grid", "default")).toBe(9);
  });

  it("a lista independe do grid da coleção", () => {
    expect(getPerPageOptionsForView("list", "collection")).toEqual([18, 24, 30]);
    expect(getDefaultPerPageForView("list", "collection")).toBe(18);
  });
});

describe("isPerPageOptionEnabled", () => {
  const grade = [12, 16, 20];

  it("mantém a menor opção sempre disponível", () => {
    expect(isPerPageOptionEnabled(grade, 12, 0)).toBe(true);
    expect(isPerPageOptionEnabled(grade, 12, 4)).toBe(true);
  });

  it("desabilita a opção que a anterior já cobre por inteiro", () => {
    expect(isPerPageOptionEnabled(grade, 16, 4)).toBe(false);
    expect(isPerPageOptionEnabled(grade, 20, 4)).toBe(false);
  });

  it("habilita a opção assim que ela mostra mais que a anterior", () => {
    expect(isPerPageOptionEnabled(grade, 16, 14)).toBe(true);
    expect(isPerPageOptionEnabled(grade, 20, 14)).toBe(false);
    expect(isPerPageOptionEnabled(grade, 20, 17)).toBe(true);
  });

  it("vale para as opções de 3 colunas", () => {
    expect(isPerPageOptionEnabled([9, 12, 15], 12, 10)).toBe(true);
    expect(isPerPageOptionEnabled([9, 12, 15], 15, 10)).toBe(false);
  });
});
