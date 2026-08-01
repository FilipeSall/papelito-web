import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchCatalogProducts } from "./catalog-search";

const wpRest = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/wp-rest", () => ({ wpRest }));

describe("searchCatalogProducts", () => {
  beforeEach(() => {
    wpRest.mockReset();
  });

  it("serializa busca, filtros e paginação para o endpoint único", async () => {
    wpRest.mockResolvedValue({
      ok: true,
      status: 200,
      data: { ids: [12, 8], total: 2, page: 2, per_page: 9 },
      headers: new Headers(),
    });

    await expect(
      searchCatalogProducts({
        search: "Seda trad",
        categorySlugs: ["papel", "hemp"],
        minPrice: 4.5,
        maxPrice: 12,
        page: 2,
        perPage: 9,
      }),
    ).resolves.toEqual({ ids: [12, 8], total: 2, page: 2, per_page: 9 });

    expect(wpRest).toHaveBeenCalledWith(
      "/papelito/v1/catalog/search?busca=Seda+trad&page=2&per_page=9&categories=papel%2Chemp&preco_min=4.5&preco_max=12",
      { revalidate: 60, tags: ["wp:products"] },
    );
  });

  it("rejeita uma resposta inválida em vez de produzir paginação incorreta", async () => {
    wpRest.mockResolvedValue({ ok: true, status: 200, data: { ids: ["12"] }, headers: new Headers() });

    await expect(
      searchCatalogProducts({
        search: "seda",
        categorySlugs: [],
        minPrice: null,
        maxPrice: null,
        page: 1,
        perPage: 9,
      }),
    ).rejects.toThrow("Não foi possível pesquisar o catálogo.");
  });
});
