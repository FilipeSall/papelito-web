import { describe, expect, it } from "vitest";

import {
  normalizeProductTypeParam,
  normalizeSelectedTypesParam,
  resolveRootProductType,
  resolveSelectedTypesFromParams,
} from "./product-type-taxonomy";

describe("resolveRootProductType", () => {
  it("mapeia as raizes reais do WordPress para os tipos da UI", () => {
    expect(resolveRootProductType("Papel", "papel")).toBe("sedas");
    expect(resolveRootProductType("Piteiras", "piteiras")).toBe("piteiras");
    expect(resolveRootProductType("Filtro", "filtro")).toBe("filtros");
    expect(resolveRootProductType("Acessórios", "acessorios")).toBe("acessorios");
  });

  it("aceita as raizes da geração anterior do import", () => {
    expect(resolveRootProductType("Seda", "seda")).toBe("sedas");
    expect(resolveRootProductType("Sedas", "sedas")).toBe("sedas");
    expect(resolveRootProductType("Piteira", "piteira")).toBe("piteiras");
    expect(resolveRootProductType("Filtros", "filtros")).toBe("filtros");
  });

  it("ignora acento e caixa", () => {
    expect(resolveRootProductType("ACESSÓRIOS", "")).toBe("acessorios");
    expect(resolveRootProductType("acessorios", "")).toBe("acessorios");
    expect(resolveRootProductType("", "Papel")).toBe("sedas");
  });

  it("não tem catch-all: raiz desconhecida fica sem tipo", () => {
    expect(resolveRootProductType("Sem categoria", "sem-categoria")).toBeNull();
    expect(resolveRootProductType("Bandeja", "bandeja")).toBeNull();
    expect(resolveRootProductType("Recompensas", "recompensas")).toBeNull();
    expect(resolveRootProductType("Display da Sorte", "display-da-sorte")).toBeNull();
  });

  it("não casa por substring — subcategoria não vira raiz", () => {
    expect(resolveRootProductType("Livretos de Seda", "livretos-de-seda")).toBeNull();
    expect(resolveRootProductType("Com Piteira", "com-piteira")).toBeNull();
    expect(resolveRootProductType("Slim", "slim-filtros")).toBeNull();
  });
});

describe("normalizeProductTypeParam", () => {
  it("aceita os quatro tipos do menu", () => {
    expect(normalizeProductTypeParam("sedas")).toBe("sedas");
    expect(normalizeProductTypeParam("piteiras")).toBe("piteiras");
    expect(normalizeProductTypeParam("filtros")).toBe("filtros");
    expect(normalizeProductTypeParam("acessorios")).toBe("acessorios");
  });

  it("cai em todos quando o parametro está ausente ou vazio", () => {
    expect(normalizeProductTypeParam(undefined)).toBe("todos");
    expect(normalizeProductTypeParam("")).toBe("todos");
    expect(normalizeProductTypeParam("   ")).toBe("todos");
    expect(normalizeProductTypeParam("todos")).toBe("todos");
  });

  it("cai em todos quando o parametro é inválido", () => {
    expect(normalizeProductTypeParam("xyz")).toBe("todos");
    expect(normalizeProductTypeParam("papel")).toBe("todos");
    expect(normalizeProductTypeParam("../../etc/passwd")).toBe("todos");
  });

  it("tolera acento, caixa e singular na URL", () => {
    expect(normalizeProductTypeParam("Acessórios")).toBe("acessorios");
    expect(normalizeProductTypeParam("ACESSORIOS")).toBe("acessorios");
    expect(normalizeProductTypeParam("seda")).toBe("sedas");
  });

  it("usa o primeiro valor quando o parametro vem repetido", () => {
    expect(normalizeProductTypeParam(["filtros", "sedas"])).toBe("filtros");
  });
});

describe("normalizeSelectedTypesParam", () => {
  it("lê lista separada por vírgula, deduplicando", () => {
    expect(normalizeSelectedTypesParam("sedas,filtros,sedas")).toEqual(["sedas", "filtros"]);
  });

  it("descarta entradas inválidas sem invalidar a lista", () => {
    expect(normalizeSelectedTypesParam("sedas,xyz,acessorios")).toEqual([
      "sedas",
      "acessorios",
    ]);
    expect(normalizeSelectedTypesParam("xyz")).toEqual([]);
  });
});

describe("resolveSelectedTypesFromParams", () => {
  it("traduz ?tipo= em uma seleção única", () => {
    expect(resolveSelectedTypesFromParams({ tipo: "acessorios" })).toEqual({
      queryType: "acessorios",
      selectedTypes: ["acessorios"],
    });
  });

  it("não seleciona nada em TODOS", () => {
    expect(resolveSelectedTypesFromParams({})).toEqual({
      queryType: "todos",
      selectedTypes: [],
    });
  });

  it("dá precedência a ?tipos= sobre ?tipo=", () => {
    expect(
      resolveSelectedTypesFromParams({ tipo: "sedas", tipos: "filtros,piteiras" }),
    ).toEqual({
      queryType: "sedas",
      selectedTypes: ["filtros", "piteiras"],
    });
  });

  it("tipo inválido não vira filtro", () => {
    expect(resolveSelectedTypesFromParams({ tipo: "xyz" })).toEqual({
      queryType: "todos",
      selectedTypes: [],
    });
  });
});
