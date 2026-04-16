export type ProductsViewMode = "grid" | "list";

const GRID_VIEW_PER_PAGE_OPTIONS = [9, 12, 15] as const;
const LIST_VIEW_PER_PAGE_OPTIONS = [18, 24, 30] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

export function getPerPageOptionsForView(viewMode: ProductsViewMode) {
  return viewMode === "list"
    ? [...LIST_VIEW_PER_PAGE_OPTIONS]
    : [...GRID_VIEW_PER_PAGE_OPTIONS];
}

export function normalizeProductsPerPage(
  value: string | undefined,
  viewMode: ProductsViewMode,
) {
  const parsed = parsePerPage(value);
  if (parsed === null) {
    return getDefaultPerPageForView(viewMode);
  }

  return clamp(parsed, 1, 60);
}
