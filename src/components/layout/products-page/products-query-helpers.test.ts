import { describe, expect, it } from "vitest";

import {
  normalizeProductTypeParam,
  normalizeSelectedTypesParam,
  normalizeSubcategoryParam,
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

  it("preserva a busca ao navegar por filtros e páginas", () => {
    const href = buildProductsHref({
      selectedTypes: ["sedas"],
      minPrice: 10,
      maxPrice: null,
      viewMode: "list",
      perPage: 24,
      page: 2,
      search: "Seda trad",
    });

    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("busca")).toBe("Seda trad");
    expect(params.get("page")).toBe("2");
    expect(params.get("tipo")).toBe("sedas");
    expect(params.get("precoMin")).toBe("10");
  });
});

describe("contrato de URL das subcategorias", () => {
  function hrefWith(selectedSubcategories: string[], overrides = {}) {
    return buildProductsHref({
      selectedTypes: ["sedas"],
      selectedSubcategories,
      minPrice: null,
      maxPrice: null,
      viewMode: "grid",
      perPage: 9,
      ...overrides,
    });
  }

  it("emite `?subcategoria=` escopada por categoria, sem percent-encoding do ponto", () => {
    expect(hrefWith(["sedas.brown", "sedas.slim"])).toBe(
      "/produtos?tipo=sedas&subcategoria=sedas.brown%2Csedas.slim&perPage=9",
    );
  });

  it("a lista volta inteira ao ser lida pela página", () => {
    const params = new URLSearchParams(hrefWith(["sedas.brown", "sedas.slim"]).split("?")[1]);

    expect(normalizeSubcategoryParam(params.get("subcategoria") ?? undefined)).toEqual([
      "sedas.brown",
      "sedas.slim",
    ]);
    expect(resolveSelectedTypesFromParams({ tipo: params.get("tipo") ?? undefined })).toEqual({
      queryType: "sedas",
      selectedTypes: ["sedas"],
    });
  });

  it("sem subcategoria selecionada o parâmetro some da URL", () => {
    expect(hrefWith([])).toBe("/produtos?tipo=sedas&perPage=9");
  });

  it("a paginação preserva a subcategoria", () => {
    const params = new URLSearchParams(hrefWith(["sedas.brown"], { page: 3 }).split("?")[1]);

    expect(params.get("page")).toBe("3");
    expect(params.get("subcategoria")).toBe("sedas.brown");
  });

  it("guarda o refinamento de várias categorias na mesma URL", () => {
    const params = new URLSearchParams(
      hrefWith(["sedas.brown", "piteiras.slim"], {
        selectedTypes: ["sedas", "piteiras"],
      }).split("?")[1],
    );

    expect(params.get("tipos")).toBe("sedas,piteiras");
    expect(normalizeSubcategoryParam(params.get("subcategoria") ?? undefined)).toEqual([
      "sedas.brown",
      "piteiras.slim",
    ]);
  });

  it("a subcategoria convive com busca, preço, visualização e itens por página", () => {
    const params = new URLSearchParams(
      hrefWith(["sedas.brown"], {
        minPrice: 5,
        maxPrice: 90,
        viewMode: "list",
        perPage: 24,
        search: "seda",
      }).split("?")[1],
    );

    expect(params.get("subcategoria")).toBe("sedas.brown");
    expect(params.get("precoMin")).toBe("5");
    expect(params.get("precoMax")).toBe("90");
    expect(params.get("view")).toBe("list");
    expect(params.get("perPage")).toBe("24");
    expect(params.get("busca")).toBe("seda");
  });

  it("normaliza caixa e acento do escopo válido", () => {
    expect(normalizeSubcategoryParam("sedas.brown,SEDAS.KING_SIZE,")).toEqual([
      "sedas.brown",
      "sedas.king-size",
    ]);
  });

  /**
   * Descartar em silêncio transformaria filtro quebrado em filtro ausente, e a
   * listagem devolveria a categoria inteira em vez de cair fechada.
   */
  it("preserva o escopo malformado, para o servidor cair fechado", () => {
    expect(normalizeSubcategoryParam("sedas.,.brown,../etc/passwd")).toEqual([
      "sedas.",
      ".brown",
      ".",
    ]);
  });

  /** Link já compartilhado continua valendo: o slug solto é resolvido no servidor. */
  it("aceita o slug sem escopo do formato antigo", () => {
    expect(normalizeSubcategoryParam("brown,king-size")).toEqual(["brown", "king-size"]);
  });
});
