import { describe, expect, it } from "vitest";

import { mapWpProductToCatalogItem, type WpProductNode } from "./wp-catalog";
import { resolveSubcategorySlugs, type PapelitoTaxonomy } from "./get-papelito-categories";

function node(overrides: Partial<WpProductNode> = {}): WpProductNode {
  return {
    databaseId: 1,
    id: "gid://1",
    name: "Seda Brown King Size",
    price: "10,00",
    regularPrice: "10,00",
    slug: "seda-brown-king-size",
    ...overrides,
  } as WpProductNode;
}

const taxonomy: PapelitoTaxonomy = {
  available: true,
  version: 1,
  categories: [
    {
      description: "",
      iconUrl: null,
      id: 1,
      name: "Sedas",
      productCount: 10,
      seoDescription: "",
      seoTitle: "",
      slug: "sedas",
      sortOrder: 0,
      subcategories: [
        { facet: "material", id: 10, name: "Brown", slug: "brown", sortOrder: 0 },
        { facet: "formato", id: 11, name: "King Size", slug: "king-size", sortOrder: 0 },
      ],
    },
    {
      description: "",
      iconUrl: null,
      id: 2,
      name: "Piteiras",
      productCount: 10,
      seoDescription: "",
      seoTitle: "",
      slug: "piteiras",
      sortOrder: 1,
      subcategories: [
        { facet: "tamanho", id: 20, name: "Mega Longa", slug: "mega-longa", sortOrder: 0 },
      ],
    },
  ],
};

describe("tipo do produto pela taxonomia Papelito", () => {
  it("usa o slug da categoria Papelito como id da UI", () => {
    const item = mapWpProductToCatalogItem(
      node({ papelitoCategory: { databaseId: 1, name: "Sedas", slug: "sedas" } }),
      0,
    );

    expect(item.type).toBe("sedas");
  });

  it("ignora product_cat quando a categoria Papelito está presente", () => {
    const item = mapWpProductToCatalogItem(
      node({
        papelitoCategory: { databaseId: 2, name: "Piteiras", slug: "piteiras" },
      }),
      0,
    );

    expect(item.type).toBe("piteiras");
  });

  it("produto sem categoria nao e absorvido por outra", () => {
    const item = mapWpProductToCatalogItem(
      node({ name: "Piteira Longa", papelitoCategory: null }),
      0,
    );

    // Sem inferência por nome: "Piteira Longa" NÃO vira `piteiras` por substring.
    expect(item.type).toBe("");
  });

  it("não absorve o produto em outra categoria quando o slug é desconhecido", () => {
    const item = mapWpProductToCatalogItem(
      node({
        name: "Produto Novo",
        papelitoCategory: { databaseId: 9, name: "Bituqueiras", slug: "bituqueiras" },
      }),
      0,
    );

    // Cai na inferência antiga em vez de virar `sedas` por acidente.
    expect(item.type).toBe("bituqueiras");
  });
});

describe("subcategorias no item do catálogo", () => {
  it("expõe os slugs das subcategorias", () => {
    const item = mapWpProductToCatalogItem(
      node({
        papelitoCategory: { databaseId: 1, name: "Sedas", slug: "sedas" },
        papelitoSubcategories: [
          { databaseId: 10, facet: "material", name: "Brown", slug: "brown" },
          { databaseId: 11, facet: "formato", name: "King Size", slug: "king-size" },
        ],
      }),
      0,
    );

    expect(item.subcategories).toEqual(["brown", "king-size"]);
  });

  it("devolve lista vazia para produto sem subcategoria", () => {
    expect(mapWpProductToCatalogItem(node(), 0).subcategories).toEqual([]);
  });

  it("descarta nó sem slug em vez de quebrar", () => {
    const item = mapWpProductToCatalogItem(
      node({
        papelitoSubcategories: [
          { databaseId: 10, facet: "material", name: "Brown", slug: "brown" },
          null,
          { databaseId: 11, facet: "formato", name: "?", slug: null },
        ],
      }),
      0,
    );

    expect(item.subcategories).toEqual(["brown"]);
  });
});

describe("coleções curadas", () => {
  it("lê a coleção do dado persistido, não do nome", () => {
    const item = mapWpProductToCatalogItem(
      node({ name: "Seda Comum", papelitoCollections: ["premium"] }),
      0,
    );

    expect(item.isPremium).toBe(true);
    expect(item.isKit).toBe(false);
  });

  it("marca kit sem depender de substring no nome", () => {
    const item = mapWpProductToCatalogItem(
      node({ name: "Combo Iniciante", papelitoCollections: ["kits"] }),
      0,
    );

    expect(item.isKit).toBe(true);
  });

  it("não marca premium quando a lista de coleções está vazia", () => {
    const item = mapWpProductToCatalogItem(
      node({ name: "Seda Premium Insane", papelitoCollections: [] }),
      0,
    );

    // Lista vazia é uma resposta, não ausência: o produto não está na coleção.
    expect(item.isPremium).toBe(false);
  });

  it("ausencia do campo nao marca colecao nenhuma", () => {
    const item = mapWpProductToCatalogItem(node({ papelitoCollections: undefined }), 0);

    expect(item.isPremium).toBe(false);
    expect(item.isKit).toBe(false);
  });
});

describe("resolveSubcategorySlugs", () => {
  it("resolve slugs existentes dentro da categoria", () => {
    expect(resolveSubcategorySlugs(taxonomy, "sedas", ["brown"])).toEqual({
      resolved: ["brown"],
      unresolved: false,
    });
  });

  it("marca como não resolvido o slug que não existe", () => {
    expect(resolveSubcategorySlugs(taxonomy, "sedas", ["inexistente"])).toEqual({
      resolved: [],
      unresolved: true,
    });
  });

  it("marca como não resolvido o slug de outra categoria", () => {
    // `mega-longa` existe, mas em Piteiras. Sem o escopo por categoria, o filtro
    // devolveria produtos que o usuário não pediu.
    expect(resolveSubcategorySlugs(taxonomy, "sedas", ["mega-longa"])).toEqual({
      resolved: [],
      unresolved: true,
    });
  });

  it("marca como não resolvido quando a categoria não existe", () => {
    expect(resolveSubcategorySlugs(taxonomy, "nao-existe", ["brown"])).toEqual({
      resolved: [],
      unresolved: true,
    });
  });

  it("lista vazia não é pedido não resolvido", () => {
    expect(resolveSubcategorySlugs(taxonomy, "sedas", [])).toEqual({
      resolved: [],
      unresolved: false,
    });
  });

  it("mesmo slug em categorias diferentes é resolvido no escopo certo", () => {
    const comSlimNasDuas: PapelitoTaxonomy = {
      ...taxonomy,
      categories: taxonomy.categories.map((category) => ({
        ...category,
        subcategories: [
          ...category.subcategories,
          { facet: "formato", id: category.id * 100, name: "Slim", slug: "slim", sortOrder: 9 },
        ],
      })),
    };

    expect(resolveSubcategorySlugs(comSlimNasDuas, "sedas", ["slim"]).resolved).toEqual(["slim"]);
    expect(resolveSubcategorySlugs(comSlimNasDuas, "piteiras", ["slim"]).resolved).toEqual(["slim"]);
  });
});
