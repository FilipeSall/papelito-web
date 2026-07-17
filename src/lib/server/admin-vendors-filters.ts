import "server-only";

import { firstParam } from "@/lib/search-params";

export type AdminVendorsPageSearchParams = Record<string, string | string[] | undefined>;

export type AdminVendorsFilters = {
  page: number;
  perPage: number;
  search: string;
};

const DEFAULT_PER_PAGE = 20;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseAdminVendorsFilters(
  searchParams: AdminVendorsPageSearchParams = {},
): AdminVendorsFilters {
  return {
    page: parsePositiveInt(firstParam(searchParams.page), 1),
    perPage: DEFAULT_PER_PAGE,
    search: (firstParam(searchParams.search) ?? "").trim(),
  };
}

export function buildAdminVendorsQuery(
  filters: AdminVendorsFilters,
  overrides: Partial<AdminVendorsFilters> = {},
): string {
  const params = new URLSearchParams();
  const page = overrides.page ?? filters.page;
  const search = overrides.search ?? filters.search;

  if (page > 1) {
    params.set("page", String(page));
  }
  if (search) {
    params.set("search", search);
  }

  return params.toString();
}
