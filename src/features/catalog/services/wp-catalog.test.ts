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
    papelitoCategory: { databaseId: 1, name: "Sedas", slug: "sedas" },
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
  function buildNode(name: string, categorySlug: string | null) {
    return {
      id: `gid://${name}`,
      databaseId: 1,
      name,
      slug: "produto",
      price: "R$ 90,00",
      papelitoCategory: categorySlug
        ? { databaseId: 1, name: categorySlug, slug: categorySlug }
        : null,
    };
  }

  it("usa o slug da categoria Papelito, não o nome do produto", () => {
    const item = mapWpProductToCatalogItem(buildNode("Seda Especial", "acessorios"), 0);

    expect(item.type).toBe("acessorios");
  });

  it("classifica a seda pela categoria, não por substring", () => {
    const item = mapWpProductToCatalogItem(buildNode("Papel Fino", "sedas"), 0);

    expect(item.type).toBe("sedas");
  });

  it("slug desconhecido não vira outra categoria por acidente", () => {
    // Não existe mais inferência por nome: "Piteira Longa" com categoria
    // desconhecida NÃO vira `piteiras`. Classificar por substring era proibido e
    // fazia toda categoria nova cair em ACESSÓRIOS.
    const item = mapWpProductToCatalogItem(buildNode("Piteira Longa", "bituqueiras"), 0);

    expect(item.type).toBe("bituqueiras");
  });

  it("produto sem categoria permanece sem classificação", () => {
    expect(mapWpProductToCatalogItem(buildNode("Produto Solto", null), 0).type).toBe("");
  });
});
