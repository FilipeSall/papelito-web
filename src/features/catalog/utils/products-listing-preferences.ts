export type ProductsViewMode = "grid" | "list";

const GRID_VIEW_PER_PAGE_OPTIONS = [9, 12, 15] as const;
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

export function getDefaultPerPageForView(viewMode: ProductsViewMode) {
  return viewMode === "list" ? LIST_VIEW_PER_PAGE_OPTIONS[0] : GRID_VIEW_PER_PAGE_OPTIONS[0];
}

export function getPerPageOptionsForView(viewMode: ProductsViewMode): number[] {
  return viewMode === "list"
    ? [...LIST_VIEW_PER_PAGE_OPTIONS]
    : [...GRID_VIEW_PER_PAGE_OPTIONS];
}

/**
 * Resolve o `perPage` da URL contra as opções oferecidas pela visualização.
 *
 * Valida contra a allow-list em vez de só limitar a faixa: um valor aceito mas ausente do
 * seletor (o caso de `18` em grade) deixa a UI sem opção ativa e a URL divergente do que a
 * interface sabe oferecer.
 */
export function normalizeProductsPerPage(
  value: string | undefined,
  viewMode: ProductsViewMode,
) {
  const parsed = parsePerPage(value);
  if (parsed === null || !getPerPageOptionsForView(viewMode).includes(parsed)) {
    return getDefaultPerPageForView(viewMode);
  }

  return parsed;
}
