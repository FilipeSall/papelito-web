import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export type AdminCompanyRow = {
  activeMembers: number;
  cnpj: string;
  companyStatus: string;
  createdAt: string;
  id: number;
  legalName: string;
  ownerEmail: string;
  ownerName: string;
  ownerUserId: number;
  ownershipStatus: string;
  pendingMembers: number;
  registryStatus: string;
  tradeName: string;
};

export type AdminCompaniesFilters = {
  companyStatus: string;
  page: number;
  perPage: number;
  search: string;
};

export type AdminCompaniesSnapshot = {
  currentPage: number;
  issues: string[];
  perPage: number;
  rows: AdminCompanyRow[];
  totalPages: number;
  totalRows: number;
};

export type AdminCompanyMember = {
  accountStatus: string;
  email: string;
  isVendor: boolean;
  name: string;
  role: string;
  status: string;
  userId: number;
};

export type AdminCompanyEvent = {
  action: string;
  actorName: string;
  actorUserId: number;
  createdAt: string;
  reason: string;
};

export type AdminCompanyDetail = {
  company: {
    billingEmail: string;
    billingEmailVerifiedAt: string | null;
    cnpj: string;
    companyStatus: string;
    createdAt: string;
    createdByUserId: number;
    fiscalAddress: {
      cep: string;
      city: string;
      complement: string;
      neighborhood: string;
      number: string;
      state: string;
      street: string;
    };
    id: number;
    legalName: string;
    ownerUserId: number | null;
    ownershipStatus: string;
    phone: string;
    registryStatus: string;
    rejectionReason: string | null;
    tradeName: string | null;
  };
  events: AdminCompanyEvent[];
  members: AdminCompanyMember[];
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRow(raw: unknown): AdminCompanyRow | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const id = toNumber(row.id);

  if (id <= 0) {
    return null;
  }

  return {
    activeMembers: toNumber(row.activeMembers),
    cnpj: String(row.cnpj ?? ""),
    companyStatus: String(row.company_status ?? row.companyStatus ?? ""),
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
    id,
    legalName: String(row.legal_name ?? row.legalName ?? ""),
    ownerEmail: String(row.ownerEmail ?? ""),
    ownerName: String(row.ownerName ?? ""),
    ownerUserId: toNumber(row.ownerUserId),
    ownershipStatus: String(row.ownership_status ?? row.ownershipStatus ?? ""),
    pendingMembers: toNumber(row.pendingMembers),
    registryStatus: String(row.registry_status ?? row.registryStatus ?? ""),
    tradeName: String(row.trade_name ?? row.tradeName ?? ""),
  };
}

export async function getAdminCompaniesSnapshot(
  accessToken: string | undefined,
  filters: AdminCompaniesFilters,
): Promise<AdminCompaniesSnapshot> {
  const empty: AdminCompaniesSnapshot = {
    currentPage: filters.page,
    issues: [],
    perPage: filters.perPage,
    rows: [],
    totalPages: 1,
    totalRows: 0,
  };

  if (!accessToken) {
    return { ...empty, issues: ["Sessão sem access token para consultar empresas."] };
  }

  const query = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
  });

  if (filters.companyStatus && filters.companyStatus !== "all") {
    query.set("companyStatus", filters.companyStatus);
  }

  if (filters.search) {
    query.set("search", filters.search);
  }

  const result = await wpRest<{ items?: unknown[]; total?: unknown; page?: unknown; perPage?: unknown }>(
    `/papelito/v1/admin/companies?${query.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!result.ok) {
    return { ...empty, issues: [`[wp] companies -> ${result.error.message}`] };
  }

  const rows = Array.isArray(result.data.items)
    ? (result.data.items.map(mapRow).filter(Boolean) as AdminCompanyRow[])
    : [];
  const totalRows = toNumber(result.data.total, rows.length);
  const perPage = Math.max(1, toNumber(result.data.perPage, filters.perPage));

  return {
    currentPage: Math.max(1, toNumber(result.data.page, filters.page)),
    issues: [],
    perPage,
    rows,
    totalPages: Math.max(1, Math.ceil(totalRows / perPage)),
    totalRows,
  };
}

export async function getAdminCompanyDetail(
  accessToken: string | undefined,
  companyId: number,
): Promise<AdminCompanyDetail | null> {
  if (!accessToken || !Number.isFinite(companyId) || companyId <= 0) {
    return null;
  }

  const result = await wpRest<AdminCompanyDetail>(`/papelito/v1/admin/companies/${companyId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? result.data : null;
}
