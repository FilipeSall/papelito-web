import { firstParam } from "@/lib/search-params";

export type AdminUsersPageSearchParams = Record<string, string | string[] | undefined>;

export const ADMIN_USER_ROLES = ["all", "administrator", "customer", "seller", "other"] as const;

export type AdminUserFilterRole = (typeof ADMIN_USER_ROLES)[number];

export type AdminUsersFilters = {
  page: number;
  perPage: number;
  role: AdminUserFilterRole;
  search: string;
};

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeRole(value: string | undefined): AdminUserFilterRole {
  if (value && (ADMIN_USER_ROLES as readonly string[]).includes(value)) {
    return value as AdminUserFilterRole;
  }

  return "all";
}

export function parseAdminUsersFilters(
  searchParams: AdminUsersPageSearchParams = {},
): AdminUsersFilters {
  return {
    page: parsePositiveInt(firstParam(searchParams.page), 1),
    perPage: Math.min(
      MAX_PER_PAGE,
      Math.max(1, parsePositiveInt(firstParam(searchParams.perPage), DEFAULT_PER_PAGE)),
    ),
    role: normalizeRole(firstParam(searchParams.role)),
    search: (firstParam(searchParams.search) ?? "").trim(),
  };
}

export function buildAdminUsersQuery(
  filters: AdminUsersFilters,
  overrides: Partial<AdminUsersFilters> = {},
): string {
  const params = new URLSearchParams();
  const page = overrides.page ?? filters.page;
  const perPage = overrides.perPage ?? filters.perPage;
  const role = overrides.role ?? filters.role;
  const search = overrides.search ?? filters.search;

  if (role !== "all") {
    params.set("role", role);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (perPage !== DEFAULT_PER_PAGE) {
    params.set("perPage", String(perPage));
  }

  if (search) {
    params.set("search", search);
  }

  return params.toString();
}
