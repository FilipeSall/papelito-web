import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  WP_PRODUCT_CATEGORIES,
  buildCategoriesResponse,
  buildProductsResponse,
} from "../../../../test/factories/wp-catalog-taxonomy";

const wpGraphqlRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-graphql", () => ({
  wpGraphqlRequest,
}));

vi.mock("@/lib/server/env", () => ({
  isMockDataEnabled: () => false,
  getWpGraphqlEndpoint: () => "http://wordpress.test/graphql",
}));

const activeFlashSale = vi.hoisted(() => ({
  current: null as { productIds: number[]; products: unknown[] } | null,
}));

vi.mock("./get-home-flash-sale", () => ({
  getHomeFlashSale: () => Promise.resolve(activeFlashSale.current),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: <T,>(fn: T) => fn };
});

interface GraphqlCall {
  query: string;
  variables: Record<string, unknown>;
}

let calls: GraphqlCall[] = [];
let categories = WP_PRODUCT_CATEGORIES;

function fixturePrice(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", "."));
}

/**
 * O WordPress filtra faixa de preço pelo preço regular e ignora o desconto da campanha:
 * o stub precisa reproduzir isso para o teste do filtro valer alguma coisa.
 */
function stubWordPress() {
  wpGraphqlRequest.mockImplementation(
    async (query: string, variables: Record<string, unknown> = {}) => {
      calls.push({ query, variables });

      if (query.includes("query Categories")) {
        return buildCategoriesResponse(categories);
      }

      const { products } = buildProductsResponse(variables.categoryIn as string[] | undefined);
      const include = variables.include as number[] | undefined;
      const minPrice = variables.minPrice as number | undefined;
      const maxPrice = variables.maxPrice as number | undefined;

      return {
        products: {
          nodes: products.nodes.filter((node) => {
            if (include && !include.includes(node.databaseId)) {
              return false;
            }

            const regularPrice = fixturePrice(node.regularPrice);

            if (typeof minPrice === "number" && regularPrice < minPrice) {
              return false;
            }

            return !(typeof maxPrice === "number" && regularPrice > maxPrice);
          }),
        },
      };
    },
  );
}

async function loadCatalog() {
  const catalogModule = await import("./get-products-catalog");
  return catalogModule.getProductsCatalog;
}

function productsCall() {
  return calls.find((call) => call.query.includes("query ProductsList"));
}

beforeEach(() => {
  vi.resetModules();
  wpGraphqlRequest.mockReset();
  calls = [];
  categories = WP_PRODUCT_CATEGORIES;
  activeFlashSale.current = null;
  stubWordPress();
});

describe("getProductsCatalog — filtro por categoria", () => {
  it("ACESSÓRIOS devolve só acessórios (regressão: vinham sedas)", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "acessorios",
      selectedTypes: ["acessorios"],
      perPage: 9,
    });

    expect(payload.activeType).toBe("acessorios");
    expect(payload.totalItems).toBe(6);
    expect(payload.items.every((item) => item.type === "acessorios")).toBe(true);
    expect(payload.items.some((item) => item.name.toLowerCase().includes("seda"))).toBe(false);
    expect(payload.items.map((item) => item.name)).toEqual([
      "Dichavador Tradicional",
      "Dichavador Neon",
      "Dichavador Cores",
      "Dichavador Brilho",
      "Tubelito Tradicional",
      "Tubelito Neon",
    ]);
  });

  it("SEDAS devolve só sedas e envia categoryIn na query (antes o filtro era omitido)", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "sedas",
      selectedTypes: ["sedas"],
      perPage: 60,
    });

    expect(payload.totalItems).toBe(20);
    expect(payload.items.every((item) => item.type === "sedas")).toBe(true);
    expect(payload.items.every((item) => item.name.startsWith("Seda"))).toBe(true);

    const variables = productsCall()?.variables;
    expect(variables?.categoryIn).toBeDefined();
    expect(variables?.categoryIn).toContain("papel");
    expect(variables?.categoryIn).not.toContain("acessorios");
  });

  it("cada categoria devolve um conjunto disjunto ao trocar de filtro", async () => {
    const getProductsCatalog = await loadCatalog();

    const [sedas, piteiras, filtros, acessorios] = await Promise.all(
      (["sedas", "piteiras", "filtros", "acessorios"] as const).map((type) =>
        getProductsCatalog({ type, selectedTypes: [type], perPage: 60 }),
      ),
    );

    expect(sedas.items).toHaveLength(20);
    expect(piteiras.items).toHaveLength(6);
    expect(filtros.items).toHaveLength(8);
    expect(acessorios.items).toHaveLength(6);

    const ids = [sedas, piteiras, filtros, acessorios].map(
      (payload) => new Set(payload.items.map((item) => item.id)),
    );

    for (const [index, current] of ids.entries()) {
      for (const [otherIndex, other] of ids.entries()) {
        if (index === otherIndex) {
          continue;
        }

        for (const id of current) {
          expect(other.has(id)).toBe(false);
        }
      }
    }

    const total = ids.reduce((sum, set) => sum + set.size, 0);
    expect(total).toBe(40);
  });

  it("seleção múltipla devolve a união exata dos tipos pedidos", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      selectedTypes: ["sedas", "filtros"],
      perPage: 60,
    });

    expect(payload.activeType).toBe("todos");
    expect(payload.totalItems).toBe(28);
    expect(
      payload.items.every((item) => item.type === "sedas" || item.type === "filtros"),
    ).toBe(true);
  });

  it("TODOS devolve o catálogo inteiro, sem cláusula de categoria", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ type: "todos", perPage: 60 });

    expect(payload.activeType).toBe("todos");
    expect(payload.totalItems).toBe(40);
    expect(productsCall()?.variables.categoryIn).toBeUndefined();
  });

  it("tipo inexistente ou inválido não filtra nada e não vira acessórios", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "xyz" as never,
      selectedTypes: ["nao-existe" as never],
      perPage: 60,
    });

    expect(payload.activeType).toBe("todos");
    expect(payload.selectedTypes).toEqual([]);
    expect(payload.totalItems).toBe(40);
    expect(productsCall()?.variables.categoryIn).toBeUndefined();
  });
});

describe("getProductsCatalog — paginação com filtro", () => {
  it("pagina dentro da categoria sem vazar outras categorias", async () => {
    const getProductsCatalog = await loadCatalog();

    const [first, second, third] = await Promise.all([
      getProductsCatalog({ type: "sedas", selectedTypes: ["sedas"], page: 1, perPage: 9 }),
      getProductsCatalog({ type: "sedas", selectedTypes: ["sedas"], page: 2, perPage: 9 }),
      getProductsCatalog({ type: "sedas", selectedTypes: ["sedas"], page: 3, perPage: 9 }),
    ]);

    expect(first.totalItems).toBe(20);
    expect(first.totalPages).toBe(3);
    expect(first.items).toHaveLength(9);
    expect(second.items).toHaveLength(9);
    expect(third.items).toHaveLength(2);

    for (const payload of [first, second, third]) {
      expect(payload.items.every((item) => item.type === "sedas")).toBe(true);
    }

    const pageOne = first.items.map((item) => item.id);
    const pageTwo = second.items.map((item) => item.id);
    expect(pageOne.some((id) => pageTwo.includes(id))).toBe(false);
  });

  it("página além do total volta para a última página da categoria", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "acessorios",
      selectedTypes: ["acessorios"],
      page: 99,
      perPage: 9,
    });

    expect(payload.currentPage).toBe(1);
    expect(payload.totalPages).toBe(1);
    expect(payload.items).toHaveLength(6);
    expect(payload.items.every((item) => item.type === "acessorios")).toBe(true);
  });
});

describe("getProductsCatalog — fail-closed", () => {
  it("categoria sem termo no WordPress devolve vazio, nunca o catálogo inteiro", async () => {
    categories = WP_PRODUCT_CATEGORIES.filter((category) => category.databaseId !== 156);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "acessorios",
      selectedTypes: ["acessorios"],
      perPage: 9,
    });

    expect(payload.items).toEqual([]);
    expect(payload.totalItems).toBe(0);
    expect(payload.activeType).toBe("acessorios");
    expect(productsCall()).toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("falha do WPGraphQL de categorias não abre o catálogo inteiro", async () => {
    wpGraphqlRequest.mockImplementation(async (query: string) => {
      if (query.includes("query Categories")) {
        throw new Error("boom");
      }

      return buildProductsResponse();
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "sedas",
      selectedTypes: ["sedas"],
      perPage: 9,
    });

    expect(payload.items).toEqual([]);
    expect(payload.totalItems).toBe(0);
  });

  it("categoria sem produtos não recai no catálogo inteiro", async () => {
    const getProductsCatalog = await loadCatalog();
    wpGraphqlRequest.mockImplementation(async (query: string) => {
      if (query.includes("query Categories")) {
        return buildCategoriesResponse(categories);
      }

      return { products: { nodes: [] } };
    });

    const payload = await getProductsCatalog({
      type: "filtros",
      selectedTypes: ["filtros"],
      perPage: 9,
    });

    expect(payload.items).toEqual([]);
    expect(payload.totalItems).toBe(0);
  });
});

describe("getProductsCatalog — contagem das abas", () => {
  it("usa as raízes do WordPress sem contar pai e filho duas vezes", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.tabs).toEqual([
      { id: "todos", label: "TODOS", count: 40 },
      { id: "sedas", label: "SEDAS", count: 20 },
      { id: "piteiras", label: "PITEIRAS", count: 6 },
      { id: "filtros", label: "FILTROS", count: 8 },
      { id: "acessorios", label: "ACESSÓRIOS", count: 6 },
    ]);
  });
});

describe("getProductsCatalog — campanha relâmpago", () => {
  const campaignProduct = {
    id: "11794",
    category: "Papel",
    name: "Seda Insane Brown King Size",
    badge: "Premium",
    discount: 99,
    originalPrice: 90,
    price: 0.9,
    rating: 0,
    reviews: 0,
    image: "",
    promotionContext: "contexto-assinado",
  };

  function activateCampaign() {
    activeFlashSale.current = { productIds: [11794], products: [campaignProduct] };
  }

  it("projeta o preço da campanha na grade, sem tocar nos demais produtos", async () => {
    activateCampaign();
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 60 });
    const promotional = payload.items.find((item) => item.id === "11794");

    expect(promotional).toMatchObject({
      price: 0.9,
      originalPrice: 90,
      isOnSale: true,
      promotionContext: "contexto-assinado",
    });
    expect(
      payload.items.filter((item) => item.id !== "11794").every((item) => item.price === 90),
    ).toBe(true);
  });

  it("mantém o preço regular quando não há campanha ativa (expirada devolve null)", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 60 });
    const product = payload.items.find((item) => item.id === "11794");

    expect(product).toMatchObject({ price: 90, originalPrice: 90 });
    expect(product?.promotionContext).toBeUndefined();
  });

  it("não perde o produto em campanha no filtro por faixa de preço", async () => {
    activateCampaign();
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 60, maxPrice: 10 });

    expect(payload.items.map((item) => item.id)).toEqual(["11794"]);
    expect(payload.items[0].price).toBe(0.9);
  });

  it("descarta o produto em campanha quando o preço promocional fica fora da faixa", async () => {
    activateCampaign();
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 60, minPrice: 50 });

    expect(payload.items.some((item) => item.id === "11794")).toBe(false);
    expect(payload.items.every((item) => item.price === 90)).toBe(true);
  });
});
