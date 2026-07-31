import { describe, expect, it } from "vitest";

import {
  normalizeProductTypeParam,
  normalizeSelectedTypesParam,
  resolveSelectedTypesFromParams,
  type SpecificProductTypeId,
} from "@/features/catalog/utils/product-type-taxonomy";

import { buildProductsHref } from "./products-query-helpers";

function readParams(href: string) {
  const [, query = ""] = href.split("?");
  const params = new URLSearchParams(query);

  return {
    tipo: params.get("tipo") ?? undefined,
    tipos: params.get("tipos") ?? undefined,
    page: params.get("page"),
    perPage: params.get("perPage"),
  };
}

const CHIPS: SpecificProductTypeId[] = ["sedas", "piteiras", "filtros", "acessorios"];

describe("contrato de URL dos filtros", () => {
  it("o href de cada chip volta na mesma categoria ao ser lido pela página", () => {
    for (const chip of CHIPS) {
      const href = buildProductsHref({
        selectedTypes: [chip],
        minPrice: null,
        maxPrice: null,
        viewMode: "grid",
        perPage: 9,
      });

      const params = readParams(href);
      expect(params.tipo).toBe(chip);
      expect(normalizeProductTypeParam(params.tipo)).toBe(chip);
      expect(resolveSelectedTypesFromParams(params).selectedTypes).toEqual([chip]);
    }
  });

  it("reproduz o href reportado no bug: ?tipo=acessorios&perPage=9", () => {
    const href = buildProductsHref({
      selectedTypes: ["acessorios"],
      minPrice: null,
      maxPrice: null,
      viewMode: "grid",
      perPage: 9,
    });

    expect(href).toBe("/produtos?tipo=acessorios&perPage=9");
    expect(resolveSelectedTypesFromParams(readParams(href))).toEqual({
      queryType: "acessorios",
      selectedTypes: ["acessorios"],
    });
  });

  it("o chip TODOS não emite nem tipo nem tipos", () => {
    const href = buildProductsHref({
      selectedTypes: [],
      minPrice: null,
      maxPrice: null,
      viewMode: "grid",
      perPage: 9,
    });

    const params = readParams(href);
    expect(params.tipo).toBeUndefined();
    expect(params.tipos).toBeUndefined();
    expect(resolveSelectedTypesFromParams(params).selectedTypes).toEqual([]);
  });

  it("seleção múltipla vai e volta por ?tipos=", () => {
    const href = buildProductsHref({
      selectedTypes: ["sedas", "filtros"],
      minPrice: null,
      maxPrice: null,
      viewMode: "grid",
      perPage: 12,
    });

    const params = readParams(href);
    expect(params.tipos).toBe("sedas,filtros");
    expect(normalizeSelectedTypesParam(params.tipos)).toEqual(["sedas", "filtros"]);
  });

  it("trocar de chip preserva a categoria nova e descarta a paginação antiga", () => {
    const href = buildProductsHref({
      selectedTypes: ["piteiras"],
      minPrice: null,
      maxPrice: null,
      viewMode: "grid",
      perPage: 9,
    });

    const params = readParams(href);
    expect(params.tipo).toBe("piteiras");
    expect(params.page).toBeNull();
  });

  it("a paginação mantém a categoria selecionada", () => {
    const href = buildProductsHref({
      selectedTypes: ["sedas"],
      minPrice: null,
      maxPrice: null,
      viewMode: "grid",
      perPage: 9,
      page: 2,
    });

    const params = readParams(href);
    expect(params.tipo).toBe("sedas");
    expect(params.page).toBe("2");
    expect(params.perPage).toBe("9");
    expect(resolveSelectedTypesFromParams(params).selectedTypes).toEqual(["sedas"]);
  });
});
