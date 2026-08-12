import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export interface CatalogSearchResponse {
  ids: number[];
  total: number;
  page: number;
  per_page: number;
}

export interface CatalogSearchInput {
  search: string;
  categorySlugs: string[];
  subcategorySlugs: string[];
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
  perPage: number;
}

function toPositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function parseCatalogSearchResponse(value: unknown): CatalogSearchResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const ids = Array.isArray(record.ids)
    ? record.ids.map(toPositiveInteger).filter((id): id is number => id !== null)
    : null;
  const total = toPositiveInteger(record.total) ?? (record.total === 0 ? 0 : null);
  const page = toPositiveInteger(record.page);
  const perPage = toPositiveInteger(record.per_page);

  if (!ids || total === null || !page || !perPage) {
    return null;
  }

  return { ids, total, page, per_page: perPage };
}

export async function searchCatalogProducts(
  input: CatalogSearchInput,
): Promise<CatalogSearchResponse> {
  const params = new URLSearchParams({
    busca: input.search,
    page: String(input.page),
    per_page: String(input.perPage),
  });

  if (input.categorySlugs.length > 0) {
    params.set("categories", input.categorySlugs.join(","));
  }
  if (input.subcategorySlugs.length > 0) {
    params.set("subcategories", input.subcategorySlugs.join(","));
  }
  if (input.minPrice !== null) {
    params.set("preco_min", String(input.minPrice));
  }
  if (input.maxPrice !== null) {
    params.set("preco_max", String(input.maxPrice));
  }

  const response = await wpRest<unknown>(`/papelito/v1/catalog/search?${params}`, {
    revalidate: 60,
    tags: ["wp:products"],
  });
  const parsed = response.ok ? parseCatalogSearchResponse(response.data) : null;

  if (!parsed) {
    throw new Error("Não foi possível pesquisar o catálogo.");
  }

  return parsed;
}
