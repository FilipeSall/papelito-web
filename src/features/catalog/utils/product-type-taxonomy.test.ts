import { describe, expect, it } from "vitest";

import {
  normalizeProductTypeParam,
  normalizeSelectedTypesParam,
  resolveSelectedTypesFromParams,
} from "./product-type-taxonomy";

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

  it("preserva slug válido para a validação contra a taxonomia no servidor", () => {
    expect(normalizeProductTypeParam("xyz")).toBe("xyz");
    expect(normalizeProductTypeParam("papel")).toBe("papel");
    expect(normalizeProductTypeParam("../../etc/passwd")).toBe("todos");
  });

  it("tolera acento e caixa na URL", () => {
    expect(normalizeProductTypeParam("Acessórios")).toBe("acessorios");
    expect(normalizeProductTypeParam("ACESSORIOS")).toBe("acessorios");
  });

  it("nao aceita mais apelido: o slug da categoria E o id da UI", () => {
    // `seda` (singular) era apelido de `sedas` no mapa que desapareceu. Sem o
    // mapa, o parametro tem de casar com o slug real da taxonomia.
    expect(normalizeProductTypeParam("seda")).toBe("seda");
    expect(normalizeProductTypeParam("papel")).toBe("papel");
  });

  it("usa o primeiro valor quando o parametro vem repetido", () => {
    expect(normalizeProductTypeParam(["filtros", "sedas"])).toBe("filtros");
  });
});

describe("normalizeSelectedTypesParam", () => {
  it("lê lista separada por vírgula, deduplicando", () => {
    expect(normalizeSelectedTypesParam("sedas,filtros,sedas")).toEqual(["sedas", "filtros"]);
  });

  it("preserva slugs válidos para resolver a lista dinâmica no servidor", () => {
    expect(normalizeSelectedTypesParam("sedas,xyz,acessorios")).toEqual([
      "sedas",
      "xyz",
      "acessorios",
    ]);
    expect(normalizeSelectedTypesParam("xyz")).toEqual(["xyz"]);
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

  it("tipo ainda desconhecido chega ao servidor para falhar fechado contra a taxonomia", () => {
    expect(resolveSelectedTypesFromParams({ tipo: "xyz" })).toEqual({
      queryType: "xyz",
      selectedTypes: ["xyz"],
    });
  });
});
