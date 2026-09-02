import type { ProductCollectionId } from "../types/products-catalog";

export type ProductsViewMode = "grid" | "list";

/**
 * Densidade do grid de produtos, espelhando `products-grid.tsx`:
 * `default` chega a 3 colunas em desktop, `collection` — usada quando a listagem
 * ocupa a largura cheia, sem sidebar — chega a 4.
 */
export type ProductsGridLayout = "default" | "collection";

/** 3 colunas × 3, 4 e 5 linhas. */
const GRID_VIEW_PER_PAGE_OPTIONS = [9, 12, 15] as const;
/** 4 colunas × 3, 4 e 5 linhas. */
const COLLECTION_GRID_VIEW_PER_PAGE_OPTIONS = [12, 16, 20] as const;
const LIST_VIEW_PER_PAGE_OPTIONS = [18, 24, 30] as const;

function parsePerPage(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.floor(parsed);
}

export function normalizeProductsViewMode(value: string | undefined): ProductsViewMode {
  return value === "list" ? "list" : "grid";
}

/**
 * Só a página de uma coleção específica ganha o grid de 4 colunas — `todos` e a listagem
 * geral de produtos continuam em 3, com a paginação que já tinham.
 */
export function resolveProductsGridLayout(
  surfaceLayout: ProductsGridLayout,
  activeCollection: ProductCollectionId,
): ProductsGridLayout {
  return surfaceLayout === "collection" && activeCollection !== "todos"
    ? "collection"
    : "default";
}

export function getDefaultPerPageForView(
  viewMode: ProductsViewMode,
  layout: ProductsGridLayout = "default",
) {
  return getPerPageOptionsForView(viewMode, layout)[0];
}

export function getPerPageOptionsForView(
  viewMode: ProductsViewMode,
  layout: ProductsGridLayout = "default",
): number[] {
  if (viewMode === "list") {
    return [...LIST_VIEW_PER_PAGE_OPTIONS];
  }

  return layout === "collection"
    ? [...COLLECTION_GRID_VIEW_PER_PAGE_OPTIONS]
    : [...GRID_VIEW_PER_PAGE_OPTIONS];
}

/**
 * Resolve o `perPage` da URL contra as opções oferecidas pela visualização.
 *
 * Valida contra a allow-list em vez de só limitar a faixa: um valor aceito mas ausente do
 * seletor (o caso de `18` em grade) deixa a UI sem opção ativa e a URL divergente do que a
 * interface sabe oferecer. É também o que corrige `perPage=9` numa coleção de 4 colunas,
 * que sobrava uma linha com um produto só e empurrava o resto para uma página quase vazia.
 */
export function normalizeProductsPerPage(
  value: string | undefined,
  viewMode: ProductsViewMode,
  layout: ProductsGridLayout = "default",
) {
  const parsed = parsePerPage(value);
  if (parsed === null || !getPerPageOptionsForView(viewMode, layout).includes(parsed)) {
    return getDefaultPerPageForView(viewMode, layout);
  }

  return parsed;
}

/**
 * Diz se uma opção de itens por página tem produtos que a justifiquem.
 *
 * Com 4 produtos, escolher 16 ou 20 mostra exatamente o mesmo que 12: a opção
 * existe mas não faz nada. A menor opção fica sempre disponível; as demais só
 * quando a anterior já não cabe o catálogo inteiro.
 */
export function isPerPageOptionEnabled(
  options: number[],
  option: number,
  totalItems: number,
) {
  const index = options.indexOf(option);

  if (index <= 0) {
    return true;
  }

  return totalItems > options[index - 1];
}
