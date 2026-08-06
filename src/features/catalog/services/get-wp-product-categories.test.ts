import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  WP_PRODUCT_CATEGORIES,
  buildCategoriesResponse,
} from "../../../../test/factories/wp-catalog-taxonomy";

const wpGraphqlRequest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-graphql", () => ({
  wpGraphqlRequest,
}));

vi.mock("@/lib/server/env", () => ({
  isMockDataEnabled: () => false,
  getWpGraphqlEndpoint: () => "http://wordpress.test/graphql",
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: <T,>(fn: T) => fn };
});

async function importModule() {
  return import("./get-wp-product-categories");
}

beforeEach(() => {
  vi.resetModules();
  wpGraphqlRequest.mockReset();
  wpGraphqlRequest.mockResolvedValue(buildCategoriesResponse());
});

describe("getCategoryFilterForTypes", () => {
  it("resolve acessórios sem arrastar as categorias de seda", async () => {
    const { getCategoryFilterForTypes } = await importModule();

    const filter = await getCategoryFilterForTypes(["acessorios"]);

    expect(filter.unresolved).toEqual([]);
    expect([...filter.slugs].sort()).toEqual(["acessorios", "dichavador", "tubelito"]);
    // A regressão: papel/hemp/brown/premium caíam no catch-all de acessórios.
    for (const leaked of ["papel", "hemp", "brown", "brown-slim", "premium", "tradicional"]) {
      expect(filter.slugs).not.toContain(leaked);
    }
  });

  it("resolve sedas na raiz Papel e nas suas subcategorias", async () => {
    const { getCategoryFilterForTypes } = await importModule();

    const filter = await getCategoryFilterForTypes(["sedas"]);

    expect(filter.unresolved).toEqual([]);
    expect([...filter.slugs].sort()).toEqual([
      "brown",
      "brown-slim",
      "hemp",
      "papel",
      "premium",
      "slim",
      "tradicional",
    ]);
    expect(filter.slugs).not.toContain("acessorios");
  });

  it("separa subcategorias homônimas pela raiz, não pelo nome", async () => {
    const { getCategoryFilterForTypes } = await importModule();

    const [sedas, piteiras, filtros] = await Promise.all([
      getCategoryFilterForTypes(["sedas"]),
      getCategoryFilterForTypes(["piteiras"]),
      getCategoryFilterForTypes(["filtros"]),
    ]);

    expect(sedas.slugs).toContain("slim");
    expect(piteiras.slugs).toContain("slim-piteiras");
    expect(filtros.slugs).toContain("slim-filtros");
    expect(sedas.slugs).not.toContain("slim-filtros");
    expect(filtros.slugs).not.toContain("slim");
  });

  it("une os slugs de vários tipos selecionados", async () => {
    const { getCategoryFilterForTypes } = await importModule();

    const filter = await getCategoryFilterForTypes(["piteiras", "acessorios"]);

    expect(filter.unresolved).toEqual([]);
    expect([...filter.slugs].sort()).toEqual([
      "acessorios",
      "dichavador",
      "large",
      "longas",
      "piteiras",
      "slim-piteiras",
      "tradicional-piteiras",
      "tubelito",
    ]);
  });

  it("sem tipo selecionado não há filtro nem tipo irresolvido", async () => {
    const { getCategoryFilterForTypes } = await importModule();

    expect(await getCategoryFilterForTypes([])).toEqual({
      slugs: [],
      unresolved: [],
      available: true,
    });
  });

  it("marca o tipo como irresolvido quando a categoria não existe no WordPress", async () => {
    wpGraphqlRequest.mockResolvedValue(
      buildCategoriesResponse(
        WP_PRODUCT_CATEGORIES.filter((category) => category.databaseId !== 156),
      ),
    );
    const { getCategoryFilterForTypes } = await importModule();

    const filter = await getCategoryFilterForTypes(["acessorios"]);

    expect(filter.unresolved).toEqual(["acessorios"]);
    expect(filter.slugs).toEqual([]);
    expect(filter.available).toBe(true);
  });

  it("marca todos os tipos como irresolvidos quando o WPGraphQL falha", async () => {
    wpGraphqlRequest.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getCategoryFilterForTypes } = await importModule();

    const filter = await getCategoryFilterForTypes(["sedas"]);

    // `available: false` é o que separa indisponibilidade de termo ausente: sem esse campo o
    // chamador serve a falha como "Nenhum produto encontrado.".
    expect(filter).toEqual({ slugs: [], unresolved: ["sedas"], available: false });
  });
});

describe("getCategoryTypeBySlug", () => {
  it("tipa cada slug pela raiz da árvore", async () => {
    const { getCategoryTypeBySlug } = await importModule();

    const map = await getCategoryTypeBySlug();

    expect(map.get("papel")).toBe("sedas");
    expect(map.get("hemp")).toBe("sedas");
    expect(map.get("premium")).toBe("sedas");
    expect(map.get("tubelito")).toBe("acessorios");
    expect(map.get("slim piteiras")).toBe("piteiras");
    expect(map.get("bio longo")).toBe("filtros");
  });
});

describe("getTabCounts", () => {
  it("conta pela raiz, sem somar pai e filho duas vezes", async () => {
    const { getTabCounts } = await importModule();

    expect(await getTabCounts()).toEqual({
      sedas: 20,
      piteiras: 6,
      filtros: 8,
      acessorios: 6,
      todos: 40,
    });
  });

  it("usa os descendentes quando a raiz está zerada", async () => {
    wpGraphqlRequest.mockResolvedValue(
      buildCategoriesResponse(
        WP_PRODUCT_CATEGORIES.map((category) =>
          category.databaseId === 156 ? { ...category, count: 0 } : category,
        ),
      ),
    );
    const { getTabCounts } = await importModule();

    const counts = await getTabCounts();

    expect(counts.acessorios).toBe(6);
  });
});
