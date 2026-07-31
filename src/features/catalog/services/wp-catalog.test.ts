import { describe, expect, it } from "vitest";

import {
  isCatalogProductVisible,
  mapWpProductToCatalogItem,
  mapWpProductToDetailItem,
} from "./wp-catalog";

function buildProduct(description: string) {
  return {
    id: "gid://1",
    databaseId: 1,
    name: "Seda Tradicional Mini Size",
    slug: "seda-tradicional-mini-size",
    description,
  };
}

function describeOf(description: string) {
  return mapWpProductToDetailItem(buildProduct(description), []).description;
}

describe("mapWpProductToDetailItem — descrição", () => {
  it("preserva a fronteira entre paragrafos vindos do WooCommerce", () => {
    const result = describeOf(
      "<p>A amarelinha mais queridinha do Brasil</p><p>Nosso Campeao de vendas.</p>",
    );

    expect(result.split("\n\n")).toEqual([
      "A amarelinha mais queridinha do Brasil",
      "Nosso Campeao de vendas.",
    ]);
  });

  it("não emenda título de bloco com o paragrafo seguinte", () => {
    const result = describeOf("<p>o papel branqueado</p><h3>Ficha Técnica</h3><p>Mini Size</p>");

    expect(result.split("\n\n")).toEqual(["o papel branqueado", "Ficha Técnica", "Mini Size"]);
  });

  it("mantem <br> como quebra simples dentro do mesmo paragrafo", () => {
    expect(describeOf("<p>linha um<br />linha dois</p>")).toBe("linha um\nlinha dois");
  });

  it("colapsa espaco horizontal redundante sem criar paragrafo novo", () => {
    expect(describeOf("<p>muito    espaco     aqui</p>")).toBe("muito espaco aqui");
  });

  it("normaliza sequencias longas de quebras em uma única fronteira", () => {
    expect(describeOf("<p>um</p><p></p><p></p><p>dois</p>")).toBe("um\n\ndois");
  });

  it("decodifica entidades HTML", () => {
    expect(describeOf("<p>papel &amp; seda</p>")).toBe("papel & seda");
  });

  it("usa o fallback quando não ha descrição", () => {
    expect(describeOf("")).toBe(
      "Seda Tradicional Mini Size com qualidade premium para o seu dia a dia.",
    );
  });
});

describe("isCatalogProductVisible", () => {
  const product = {
    databaseId: 1,
    height: "3",
    id: "gid://1",
    length: "16",
    name: "Produto",
    price: "R$ 10,00",
    slug: "produto",
    weight: "0.4",
    width: "11",
  };

  it("keeps a product with a valid price in the catalog", () => {
    expect(isCatalogProductVisible(product)).toBe(true);
  });

  it("keeps a product without a price out of the catalog", () => {
    expect(isCatalogProductVisible({ ...product, price: "", regularPrice: "", salePrice: "" })).toBe(false);
  });
});

describe("mapWpProductToCatalogItem — tipo do produto", () => {
  const typeBySlug = new Map<string, "sedas" | "piteiras" | "filtros" | "acessorios">([
    ["papel", "sedas"],
    ["hemp", "sedas"],
    ["acessorios", "acessorios"],
    ["tubelito", "acessorios"],
  ]);

  function buildNode(name: string, categorySlugs: string[]) {
    return {
      id: `gid://${name}`,
      databaseId: 1,
      name,
      slug: "produto",
      price: "R$ 90,00",
      productCategories: {
        nodes: categorySlugs.map((slug) => ({ slug, name: slug })),
      },
    };
  }

  it("usa a taxonomia, não o nome do produto", () => {
    const item = mapWpProductToCatalogItem(
      buildNode("Seda Especial", ["acessorios", "tubelito"]),
      0,
      typeBySlug,
    );

    expect(item.type).toBe("acessorios");
  });

  it("classifica seda cadastrada na raiz Papel", () => {
    const item = mapWpProductToCatalogItem(buildNode("Papel Fino", ["hemp", "papel"]), 0, typeBySlug);

    expect(item.type).toBe("sedas");
  });

  it("cai no nome só quando nenhuma categoria do produto está mapeada", () => {
    const item = mapWpProductToCatalogItem(
      buildNode("Piteira Longa", ["sem-categoria"]),
      0,
      typeBySlug,
    );

    expect(item.type).toBe("piteiras");
  });
});
