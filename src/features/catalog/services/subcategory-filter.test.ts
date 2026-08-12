import { describe, expect, it, vi, beforeEach } from "vitest";

import { getProductsCatalog } from "./get-products-catalog";

vi.mock(import("@/lib/server/env"), async (importOriginal) => ({
  ...(await importOriginal()),
  isMockDataEnabled: () => true,
}));

/**
 * O caminho mockado do catálogo não tem taxonomia Papelito, então estes testes
 * exercitam a normalização e o contrato do payload — a filtragem por
 * subcategoria em si é coberta por `filterCatalogItems` via payload.
 */
describe("parâmetro de subcategoria no catálogo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devolve as subcategorias selecionadas no payload", async () => {
    const payload = await getProductsCatalog({
      selectedSubcategories: ["brown", "king-size"],
    });

    expect(payload.selectedSubcategories).toEqual(["brown", "king-size"]);
  });

  it("descarta slug com formato inválido", async () => {
    const payload = await getProductsCatalog({
      selectedSubcategories: ["brown", "NÃO VALE", "../etc", "king_size", ""],
    });

    expect(payload.selectedSubcategories).toEqual(["brown"]);
  });

  it("normaliza caixa e espaço", async () => {
    const payload = await getProductsCatalog({
      selectedSubcategories: ["  BROWN  ", "King-Size"],
    });

    expect(payload.selectedSubcategories).toEqual(["brown", "king-size"]);
  });

  it("remove duplicatas", async () => {
    const payload = await getProductsCatalog({
      selectedSubcategories: ["brown", "brown", "BROWN"],
    });

    expect(payload.selectedSubcategories).toEqual(["brown"]);
  });

  it("sem subcategoria, o catálogo não é restringido", async () => {
    const semFiltro = await getProductsCatalog({});
    const comFiltroVazio = await getProductsCatalog({ selectedSubcategories: [] });

    expect(comFiltroVazio.totalItems).toBe(semFiltro.totalItems);
  });

  it("subcategoria que nenhum produto tem zera o resultado", async () => {
    const payload = await getProductsCatalog({
      selectedSubcategories: ["subcategoria-que-nao-existe"],
    });

    // Fail-closed: filtro que não casa devolve vazio, nunca o catálogo inteiro.
    expect(payload.totalItems).toBe(0);
    expect(payload.items).toEqual([]);
  });

  it("não confunde subcategoria com coleção", async () => {
    const payload = await getProductsCatalog({
      collection: "premium",
      selectedSubcategories: [],
    });

    expect(payload.activeCollection).toBe("premium");
    expect(payload.selectedSubcategories).toEqual([]);
  });
});
