import "server-only";

import { firstParam } from "@/lib/search-params";

export type AdminVendorsPageSearchParams = Record<string, string | string[] | undefined>;

export const VENDOR_APPLICATION_STATUSES = ["pending", "approved", "rejected", "all"] as const;

export type AdminVendorApplicationStatus = (typeof VENDOR_APPLICATION_STATUSES)[number];

export type AdminVendorsFilters = {
  page: number;
  perPage: number;
  search: string;
  status: AdminVendorApplicationStatus;
};

const DEFAULT_PER_PAGE = 20;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeStatus(value: string | undefined): AdminVendorApplicationStatus {
  if (value && (VENDOR_APPLICATION_STATUSES as readonly string[]).includes(value)) {
    return value as AdminVendorApplicationStatus;
  }
  return "all";
}

export function parseAdminVendorsFilters(
  searchParams: AdminVendorsPageSearchParams = {},
): AdminVendorsFilters {
  return {
    page: parsePositiveInt(firstParam(searchParams.page), 1),
    perPage: DEFAULT_PER_PAGE,
    search: (firstParam(searchParams.search) ?? "").trim(),
    status: normalizeStatus(firstParam(searchParams.status)),
  };
}

export function buildAdminVendorsQuery(
  filters: AdminVendorsFilters,
  overrides: Partial<AdminVendorsFilters> = {},
): string {
  const params = new URLSearchParams();
  const status = overrides.status ?? filters.status;
  const page = overrides.page ?? filters.page;
  const search = overrides.search ?? filters.search;

  if (status !== "all") {
    params.set("status", status);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  if (search) {
    params.set("search", search);
  }

  return params.toString();
}
