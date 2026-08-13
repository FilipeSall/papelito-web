import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PAPELITO_CATEGORIES,
  buildPapelitoTaxonomyResponse,
  buildProductNode,
} from "../../../../test/factories/wp-catalog-taxonomy";

const wpGraphqlRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-graphql", () => ({
  wpGraphqlRequest,
}));

vi.mock(import("@/lib/server/env"), async (importOriginal) => ({
  ...(await importOriginal()),
  isMockDataEnabled: () => false,
  getWpGraphqlEndpoint: () => "http://wordpress.test/graphql",
}));

const wpRest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-rest", () => ({
  wpRest,
}));

vi.mock("./get-home-flash-sale", () => ({
  getHomeFlashSale: () => Promise.resolve(null),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: <T,>(fn: T) => fn };
});

type ProductNode = Omit<ReturnType<typeof buildProductNode>, "salePrice"> & {
  salePrice: string | null;
};

function onSale(node: ProductNode, salePrice: string): ProductNode {
  return { ...node, salePrice, price: salePrice };
}

function stubProducts(nodes: ProductNode[], ok = true) {
  wpGraphqlRequest.mockImplementation(async () => {
    if (!ok) {
      throw new Error("WPGraphQL indisponível");
    }

    return { products: { nodes } };
  });
}

async function loadSummary() {
  const catalogModule = await import("./get-products-catalog");
  return catalogModule.getProductsCollectionsSummary;
}

beforeEach(() => {
  vi.resetModules();
  wpGraphqlRequest.mockReset();
  wpRest.mockReset();
  wpRest.mockImplementation(async () => ({
    ok: true,
    data: buildPapelitoTaxonomyResponse(PAPELITO_CATEGORIES),
  }));
});

describe("getProductsCollectionsSummary", () => {
  it("conta os kits que a coleção realmente lista", async () => {
    stubProducts([
      buildProductNode({
        databaseId: 1,
        name: "Kit Iniciante",
        categorySlugs: ["acessorios"],
        collections: ["kits"],
      }),
      buildProductNode({
        databaseId: 2,
        name: "Kit Completo",
        categorySlugs: ["acessorios"],
        collections: ["kits"],
      }),
      buildProductNode({
        databaseId: 3,
        name: "Seda Tradicional",
        categorySlugs: ["sedas"],
      }),
    ]);

    const getProductsCollectionsSummary = await loadSummary();

    expect(await getProductsCollectionsSummary()).toEqual({
      kitsCount: 2,
      promotionsMaxDiscountPercent: 0,
    });
  });

  it("devolve o maior desconto real entre os produtos em promoção", async () => {
    stubProducts([
      onSale(
        buildProductNode({
          databaseId: 1,
          name: "Seda A",
          categorySlugs: ["sedas"],
          price: "R$ 100,00",
        }),
        "R$ 90,00",
      ),
      onSale(
        buildProductNode({
          databaseId: 2,
          name: "Seda B",
          categorySlugs: ["sedas"],
          price: "R$ 100,00",
        }),
        "R$ 75,00",
      ),
      onSale(
        buildProductNode({
          databaseId: 3,
          name: "Seda C",
          categorySlugs: ["sedas"],
          price: "R$ 100,00",
        }),
        "R$ 85,00",
      ),
    ]);

    const getProductsCollectionsSummary = await loadSummary();
    const summary = await getProductsCollectionsSummary();

    expect(summary.promotionsMaxDiscountPercent).toBe(25);
  });

  it("catálogo sem kit nem promoção devolve zeros, e o card cai no texto fixo", async () => {
    stubProducts([
      buildProductNode({ databaseId: 1, name: "Seda A", categorySlugs: ["sedas"] }),
    ]);

    const getProductsCollectionsSummary = await loadSummary();

    expect(await getProductsCollectionsSummary()).toEqual({
      kitsCount: 0,
      promotionsMaxDiscountPercent: 0,
    });
  });

  it("origem indisponível não inventa número", async () => {
    stubProducts([], false);

    const getProductsCollectionsSummary = await loadSummary();

    expect(await getProductsCollectionsSummary()).toEqual({
      kitsCount: 0,
      promotionsMaxDiscountPercent: 0,
    });
  });
});
