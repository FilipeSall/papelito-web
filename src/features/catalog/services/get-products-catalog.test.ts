import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  PAPELITO_CATEGORIES,
  buildPapelitoTaxonomyResponse,
  buildProductNode,
  buildProductsResponse,
} from "../../../../test/factories/wp-catalog-taxonomy";
import { WP_GRAPHQL_MAX_FIRST } from "./wp-catalog";

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

// A taxonomia deixou de vir por GraphQL: agora é `GET /papelito/v1/categories`.
vi.mock("@/lib/server/wp-rest", () => ({
  wpRest,
}));

const activeFlashSale = vi.hoisted(() => ({
  current: null as { productIds: number[]; products: unknown[] } | null,
}));

vi.mock("./get-home-flash-sale", () => ({
  getHomeFlashSale: () => Promise.resolve(activeFlashSale.current),
}));

const collectionsConfig = vi.hoisted(() => ({
  current: {
    newArrivals: { expirationDays: 0, limit: 10 },
    promotions: { limit: 0 },
  },
}));

vi.mock("./get-collections-config", () => ({
  getCollectionsConfig: () => Promise.resolve(collectionsConfig.current),
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
let categories = PAPELITO_CATEGORIES;

function fixturePrice(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", "."));
}

/** O stub aceita os mesmos filtros de preço do WordPress para cobrir chamadas de busca. */
function stubWordPress() {
  wpGraphqlRequest.mockImplementation(
    async (query: string, variables: Record<string, unknown> = {}) => {
      calls.push({ query, variables });

      const { products } = buildProductsResponse();
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
  wpRest.mockReset();
  calls = [];
  categories = PAPELITO_CATEGORIES;
  activeFlashSale.current = null;
  stubWordPress();
  wpRest.mockImplementation(async () => ({
    ok: true,
    data: buildPapelitoTaxonomyResponse(categories),
  }));
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

  it("SEDAS devolve só sedas", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "sedas",
      selectedTypes: ["sedas"],
      perPage: 60,
    });

    expect(payload.totalItems).toBe(20);
    expect(payload.items.every((item) => item.type === "sedas")).toBe(true);
    expect(payload.items.every((item) => item.name.startsWith("Seda"))).toBe(true);

    // A query não filtra mais por categoria no WordPress; o narrowing acontece
    // em memória pela categoria Papelito do produto.
    expect(productsCall()?.variables).not.toHaveProperty("categoryIn");
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

  it("tipo inexistente ou inválido falha fechado e não vira acessórios", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "xyz" as never,
      selectedTypes: ["nao-existe" as never],
      perPage: 60,
    });

    expect(payload.activeType).toBe("nao-existe");
    expect(payload.selectedTypes).toEqual(["nao-existe"]);
    expect(payload.totalItems).toBe(0);
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
  it("categoria inexistente na taxonomia devolve vazio, nunca o catálogo inteiro", async () => {
    categories = PAPELITO_CATEGORIES.filter((category) => category.slug !== "acessorios");
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

  it("falha da taxonomia não abre o catálogo inteiro", async () => {
    // A taxonomia vem por REST agora. Indisponibilidade dela NÃO pode virar
    // catálogo sem filtro — tem de virar estado de erro.
    wpRest.mockImplementation(async () => ({
      ok: false,
      error: { message: "boom" },
    }));
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
    wpGraphqlRequest.mockImplementation(async () => ({ products: { nodes: [] } }));

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

describe("getProductsCatalog — origem indisponível", () => {
  it("falha do WPGraphQL de produtos vira sourceStatus 'unavailable', não catálogo vazio", async () => {
    wpGraphqlRequest.mockImplementation(async () => {
      throw new TypeError("fetch failed");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.sourceStatus).toBe("unavailable");
    expect(payload.items).toEqual([]);
  });

  it("falha da taxonomia com filtro de tipo ativo também é 'unavailable'", async () => {
    wpRest.mockImplementation(async () => ({
      ok: false,
      error: { message: "fetch failed" },
    }));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "sedas",
      selectedTypes: ["sedas"],
      perPage: 9,
    });

    expect(payload.sourceStatus).toBe("unavailable");
    expect(payload.items).toEqual([]);
  });

  it("categoria ausente com origem saudável continua 'ok' (fail-closed, não erro)", async () => {
    categories = PAPELITO_CATEGORIES.filter((category) => category.slug !== "acessorios");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      type: "acessorios",
      selectedTypes: ["acessorios"],
      perPage: 9,
    });

    expect(payload.sourceStatus).toBe("ok");
    expect(payload.items).toEqual([]);
  });

  it("catálogo legitimamente vazio continua sendo 'ok'", async () => {
    wpGraphqlRequest.mockImplementation(async () => ({ products: { nodes: [] } }));
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.sourceStatus).toBe("ok");
    expect(payload.items).toEqual([]);
  });

  it("resposta normal é 'ok'", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.sourceStatus).toBe("ok");
  });
});

describe("getProductsCatalog — varredura por cursor", () => {
  /**
   * O WPGraphQL corta `first` em 100 sem erro. O stub reproduz isso para o teste provar que a
   * varredura pagina por cursor, e não que ela confia num `first` que o servidor ignora.
   */
  function stubCappedWordPress(totalProducts: number) {
    const all = Array.from({ length: totalProducts }, (_, index) =>
      buildProductNode({
        databaseId: 20000 + index,
        name: `Seda Paginada ${index}`,
        categorySlugs: ["sedas"],
      }),
    );

    wpGraphqlRequest.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        calls.push({ query, variables });

        if (query.includes("query Categories")) {
          return buildPapelitoTaxonomyResponse(categories);
        }

        const offset = variables.after ? Number(variables.after) : 0;
        const requested = Math.min(Number(variables.first ?? 60), 100);
        const slice = all.slice(offset, offset + requested);
        const nextOffset = offset + slice.length;

        return {
          products: {
            pageInfo: {
              hasNextPage: nextOffset < all.length,
              endCursor: String(nextOffset),
            },
            nodes: slice,
          },
        };
      },
    );
  }

  it("pagina além do teto efetivo da listagem e conta o catálogo inteiro", async () => {
    stubCappedWordPress(250);
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.totalItems).toBe(250);
    expect(payload.totalPages).toBe(Math.ceil(250 / 9));

    const productPages = calls.filter((call) => call.query.includes("query ProductsList"));
    expect(productPages.length).toBe(Math.ceil(250 / WP_GRAPHQL_MAX_FIRST));
    expect(productPages.every((call) => Number(call.variables.first) <= WP_GRAPHQL_MAX_FIRST)).toBe(true);
  });

  it("não pagina quando a primeira página já esgota o catálogo", async () => {
    stubCappedWordPress(40);
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.totalItems).toBe(40);
    expect(calls.filter((call) => call.query.includes("query ProductsList")).length).toBe(1);
  });

  it("avisa e não trava quando a varredura bate no teto de segurança", async () => {
    stubCappedWordPress(5000);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ perPage: 9 });

    expect(payload.totalItems).toBe(1000);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Varredura interrompida"));
  });
});

describe("getProductsCatalog — lote constante", () => {
  it("pede o mesmo `first` para qualquer perPage e qualquer página", async () => {
    const getProductsCatalog = await loadCatalog();

    for (const [perPage, page] of [
      [9, 1],
      [12, 1],
      [15, 1],
      [18, 1],
      [30, 2],
      [9, 5],
    ] as const) {
      await getProductsCatalog({ perPage, page });
    }

    const firsts = new Set(
      calls
        .filter((call) => call.query.includes("query ProductsList"))
        .map((call) => call.variables.first),
    );

    expect(firsts.size).toBe(1);
  });

  it("totalItems não muda de uma página para outra (regressão: 36 na p1, 38 na p2)", async () => {
    const getProductsCatalog = await loadCatalog();

    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map((page) => getProductsCatalog({ perPage: 9, page })),
    );

    expect(new Set(pages.map((payload) => payload.totalItems))).toEqual(new Set([40]));
    expect(new Set(pages.map((payload) => payload.totalPages))).toEqual(new Set([5]));
  });

  it("trocar perPage não muda o total, só o fatiamento", async () => {
    const getProductsCatalog = await loadCatalog();

    const [nove, doze, dezoito] = await Promise.all([
      getProductsCatalog({ perPage: 9 }),
      getProductsCatalog({ perPage: 12 }),
      getProductsCatalog({ perPage: 18 }),
    ]);

    expect([nove.totalItems, doze.totalItems, dezoito.totalItems]).toEqual([40, 40, 40]);
    expect([nove.items.length, doze.items.length, dezoito.items.length]).toEqual([9, 12, 18]);
  });
});

describe("getProductsCatalog — coleções por termo", () => {
  it("premium sai da categoria `premium`, não de substring do nome", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ collection: "premium", perPage: 60 });

    expect(payload.items.map((item) => item.name)).toEqual([
      "Seda Pink King Size",
      "Seda Insane King Size",
      "Seda Insane Brown King Size",
      "Seda Alfafa King Size",
    ]);
    expect(payload.items.every((item) => !item.name.toLowerCase().includes("premium"))).toBe(
      true,
    );
  });

  it("coleção criada no painel não cai em `todos` e devolve o catálogo inteiro", async () => {
    const getProductsCatalog = await loadCatalog();

    const [manual, tudo] = await Promise.all([
      getProductsCatalog({ collection: "edicao-limitada", perPage: 60 }),
      getProductsCatalog({ collection: "todos", perPage: 60 }),
    ]);

    expect(tudo.totalItems).toBeGreaterThan(0);
    expect(manual.items).toEqual([]);
    expect(manual.totalItems).toBe(0);
    expect(manual.sourceStatus).toBe("ok");
  });

  it("kits fica vazio enquanto a categoria não existir no WordPress", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ collection: "kits", perPage: 60 });

    expect(payload.items).toEqual([]);
    expect(payload.sourceStatus).toBe("ok");
  });

  it("pagina a coleção no perPage do grid de 4 colunas", async () => {
    const getProductsCatalog = await loadCatalog();

    const [premium, primeira, segunda] = await Promise.all([
      getProductsCatalog({ collection: "premium", perPage: 12 }),
      getProductsCatalog({ collection: "todos", perPage: 12 }),
      getProductsCatalog({ collection: "todos", perPage: 12, page: 2 }),
    ]);

    // Coleção que cabe na página não ganha uma segunda página.
    expect(premium.totalItems).toBe(4);
    expect(premium.totalPages).toBe(1);
    expect(premium.items).toHaveLength(4);

    expect(primeira.items).toHaveLength(12);
    expect(primeira.totalPages).toBe(Math.ceil(primeira.totalItems / 12));

    expect(segunda.currentPage).toBe(2);
    expect(segunda.items).toHaveLength(12);
    expect(
      segunda.items.some((item) =>
        primeira.items.some((first) => first.id === item.id),
      ),
    ).toBe(false);
  });

  it("novidades é o mesmo conjunto para qualquer perPage e não depende da página", async () => {
    const getProductsCatalog = await loadCatalog();

    const [nove, trinta, segunda] = await Promise.all([
      getProductsCatalog({ collection: "novidades", perPage: 9 }),
      getProductsCatalog({ collection: "novidades", perPage: 30 }),
      getProductsCatalog({ collection: "novidades", perPage: 9, page: 2 }),
    ]);

    expect(nove.totalItems).toBe(10);
    expect(trinta.totalItems).toBe(10);
    expect(segunda.totalItems).toBe(10);
    expect(trinta.items.map((item) => item.id)).toEqual(
      expect.arrayContaining(nove.items.map((item) => item.id)),
    );
  });

  it("preserva o pool configurado de novidades antes de aplicar a faixa de preço", async () => {
    const { products } = buildProductsResponse();
    const newest = products.nodes[0];
    const productsWithExpensiveNewest = products.nodes.map((product, index) =>
      index === 0
        ? { ...product, price: "R$ 120,00", regularPrice: "R$ 120,00" }
        : product,
    );

    wpGraphqlRequest.mockImplementation(
      async (query: string, variables: Record<string, unknown> = {}) => {
        calls.push({ query, variables });

        if (query.includes("query Categories")) {
          return buildPapelitoTaxonomyResponse(categories);
        }

        return {
          products: {
            nodes: productsWithExpensiveNewest.filter((product) => {
              const price = fixturePrice(product.regularPrice);
              const minPrice = variables.minPrice as number | undefined;
              const maxPrice = variables.maxPrice as number | undefined;

              return (
                (typeof minPrice !== "number" || price >= minPrice) &&
                (typeof maxPrice !== "number" || price <= maxPrice)
              );
            }),
          },
        };
      },
    );

    const getProductsCatalog = await loadCatalog();
    const payload = await getProductsCatalog({
      collection: "novidades",
      maxPrice: 90,
      perPage: 60,
    });

    expect(payload.totalItems).toBe(9);
    expect(payload.items.some((item) => item.id === String(newest.databaseId))).toBe(false);
    expect(payload.items.map((item) => item.id)).toEqual(
      products.nodes.slice(1, 10).map((product) => String(product.databaseId)),
    );
  });

  it("obedece o teto configurado em vez de um número fixo", async () => {
    collectionsConfig.current = {
      newArrivals: { expirationDays: 0, limit: 3 },
      promotions: { limit: 0 },
    };

    const getProductsCatalog = await loadCatalog();
    const payload = await getProductsCatalog({ collection: "novidades", perPage: 60 });

    expect(payload.totalItems).toBe(3);

    collectionsConfig.current = {
      newArrivals: { expirationDays: 0, limit: 10 },
      promotions: { limit: 0 },
    };
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

describe("árvore de categorias no payload", () => {
  it("expõe as subcategorias da taxonomia, para o filtro lateral montar a hierarquia", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({});
    const sedas = payload.categories.find((category) => category.slug === "sedas");

    expect(sedas?.name).toBe("Sedas");
    expect(sedas?.subcategories).toEqual([
      { facet: "material", name: "Tradicional", slug: "tradicional" },
      { facet: "material", name: "Brown", slug: "brown" },
      { facet: "formato", name: "Slim", slug: "slim" },
      { facet: "formato", name: "King Size", slug: "king-size" },
    ]);
  });

  it("categoria sem subcategoria vem com lista vazia, não ausente", async () => {
    categories = PAPELITO_CATEGORIES.map((category) =>
      category.slug === "acessorios" ? { ...category, subcategories: [] } : category,
    );
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({});

    expect(
      payload.categories.find((category) => category.slug === "acessorios")?.subcategories,
    ).toEqual([]);
  });

  it("a árvore acompanha as abas, mesmo quando o filtro zera a listagem", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({ selectedTypes: ["nao-existe"] });

    expect(payload.totalItems).toBe(0);
    expect(payload.categories.map((category) => category.slug)).toEqual(
      payload.tabs.filter((tab) => tab.id !== "todos").map((tab) => tab.id),
    );
  });

  it("filtra por subcategoria dentro da categoria pedida", async () => {
    const getProductsCatalog = await loadCatalog();

    const semFiltro = await getProductsCatalog({ perPage: 60, selectedTypes: ["sedas"] });
    const comFiltro = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["sedas.brown"],
    });

    expect(comFiltro.selectedSubcategories).toEqual(["sedas.brown"]);
    expect(comFiltro.totalItems).toBeLessThanOrEqual(semFiltro.totalItems);
    expect(comFiltro.items.every((item) => item.subcategories.includes("brown"))).toBe(true);
  });
});

describe("refinamento por subcategoria com várias categorias", () => {
  /**
   * `slim` existe em Sedas e em Piteiras. Sem o escopo por categoria, refinar uma
   * apagaria a outra da listagem — ou, pior, refinaria as duas pelo mesmo slug.
   */
  it("refinar uma categoria preserva a outra inteira", async () => {
    const getProductsCatalog = await loadCatalog();

    const duas = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas", "piteiras"],
    });
    const refinada = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas", "piteiras"],
      selectedSubcategories: ["sedas.brown"],
    });

    const piteirasAntes = duas.items.filter((item) => item.type === "piteiras");
    const piteirasDepois = refinada.items.filter((item) => item.type === "piteiras");

    expect(piteirasDepois.map((item) => item.id)).toEqual(
      piteirasAntes.map((item) => item.id),
    );
    expect(
      refinada.items
        .filter((item) => item.type === "sedas")
        .every((item) => item.subcategories.includes("brown")),
    ).toBe(true);
  });

  it("cada categoria é refinada pelo próprio escopo", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas", "piteiras"],
      selectedSubcategories: ["sedas.brown", "piteiras.slim"],
    });

    expect(payload.selectedSubcategories).toEqual(["sedas.brown", "piteiras.slim"]);
    expect(
      payload.items.every((item) =>
        item.type === "sedas"
          ? item.subcategories.includes("brown")
          : item.subcategories.includes("slim"),
      ),
    ).toBe(true);
  });

  it("escopo de categoria não selecionada zera o catálogo", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["piteiras.slim"],
    });

    // Fail-closed: pedido inválido não pode virar "mostre tudo".
    expect(payload.totalItems).toBe(0);
  });

  it("escopo com subcategoria inexistente zera o catálogo", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["sedas.nao-existe"],
    });

    expect(payload.totalItems).toBe(0);
  });

  it("escopo malformado zera o catálogo em vez de abrir o filtro", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["sedas."],
    });

    expect(payload.totalItems).toBe(0);
  });

  /**
   * O estado inválido precisa sobreviver à próxima interação: ecoar a lista podada
   * apagaria o filtro dos controles, e aplicar preço sairia do resultado vazio para
   * a categoria inteira sem ninguém ter desmarcado nada.
   */
  it("o payload vazio ecoa o filtro pedido, não o que sobrou dele", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["sedas.nao-existe"],
    });

    expect(payload.totalItems).toBe(0);
    expect(payload.selectedSubcategories).toEqual(["sedas.nao-existe"]);
  });

  /**
   * O WordPress derruba o ramo inteiro quando um slug solto não resolve na
   * categoria. Filtrar só o subconjunto conhecido faria a MESMA URL responder
   * diferente com e sem busca, porque só a busca passa pelo WordPress.
   */
  it("slug sem escopo só vale para a categoria que resolve todos eles", async () => {
    const getProductsCatalog = await loadCatalog();

    const payload = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas", "piteiras"],
      selectedSubcategories: ["brown", "slim"],
    });

    // `brown` não existe em Piteiras: o ramo dela cai fora inteiro, como no SQL.
    expect(payload.items.every((item) => item.type === "sedas")).toBe(true);
    expect(
      payload.items.every(
        (item) =>
          item.subcategories.includes("brown") && item.subcategories.includes("slim"),
      ),
    ).toBe(true);
  });

  /** Link antigo, sem escopo, continua resolvendo dentro da categoria pedida. */
  it("aceita o slug sem escopo do formato antigo", async () => {
    const getProductsCatalog = await loadCatalog();

    const antigo = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["brown"],
    });
    const novo = await getProductsCatalog({
      perPage: 60,
      selectedTypes: ["sedas"],
      selectedSubcategories: ["sedas.brown"],
    });

    expect(antigo.items.map((item) => item.id)).toEqual(novo.items.map((item) => item.id));
  });
});

