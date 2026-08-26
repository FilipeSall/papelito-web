import { describe, expect, it } from "vitest";

import { resolveListingSeo } from "./listing-seo";

describe("resolveListingSeo", () => {
  it("indexa a listagem limpa apontando para ela mesma", () => {
    expect(resolveListingSeo("/produtos", {})).toEqual({
      canonicalPath: "/produtos",
      noindex: false,
    });
  });

  it("ignora preferência de apresentação no canonical", () => {
    expect(resolveListingSeo("/produtos", { view: "list", perPage: "18" })).toEqual({
      canonicalPath: "/produtos",
      noindex: false,
    });
  });

  it("canonicaliza uma categoria para a landing dela", () => {
    expect(resolveListingSeo("/produtos", { tipo: "sedas" })).toEqual({
      canonicalPath: "/categorias/sedas",
      noindex: true,
    });
  });

  it("trata `tipo` e `tipos` com uma categoria como a mesma URL", () => {
    expect(resolveListingSeo("/produtos", { tipos: "piteiras" })).toEqual(
      resolveListingSeo("/produtos", { tipo: "piteiras" }),
    );
  });

  it("devolve a listagem limpa quando há mais de uma categoria", () => {
    expect(resolveListingSeo("/produtos", { tipos: "sedas,filtros" })).toEqual({
      canonicalPath: "/produtos",
      noindex: true,
    });
  });

  it("tira a busca livre do índice sem cortar o rastreamento dos produtos", () => {
    const result = resolveListingSeo("/produtos", { busca: "seda king size" });

    expect(result).toEqual({ canonicalPath: "/produtos", noindex: true });
  });

  it("tira a faixa de preço do índice", () => {
    expect(resolveListingSeo("/produtos", { precoMin: "10" }).noindex).toBe(true);
    expect(resolveListingSeo("/produtos", { precoMax: "90" }).noindex).toBe(true);
  });

  it("tira o refinamento por subcategoria do índice", () => {
    expect(resolveListingSeo("/produtos", { tipo: "sedas", subcategoria: "sedas.brown" })).toEqual({
      canonicalPath: "/produtos",
      noindex: true,
    });
  });

  it("mantém a paginação indexável com canonical próprio", () => {
    expect(resolveListingSeo("/produtos", { page: "3" })).toEqual({
      canonicalPath: "/produtos?page=3",
      noindex: false,
    });
  });

  it("normaliza página inválida para a primeira", () => {
    expect(resolveListingSeo("/produtos", { page: "0" }).canonicalPath).toBe("/produtos");
    expect(resolveListingSeo("/produtos", { page: "abc" }).canonicalPath).toBe("/produtos");
  });

  it("preserva o basePath da coleção", () => {
    expect(resolveListingSeo("/premium", { busca: "x" }).canonicalPath).toBe("/premium");
  });
});
