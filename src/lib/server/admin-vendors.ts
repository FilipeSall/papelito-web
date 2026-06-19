import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { AdminVendorsFilters } from "@/lib/server/admin-vendors-filters";

export type AdminVendorRowStatus = "pending" | "approved" | "rejected" | "none";

export type AdminVendorRow = {
  applicationStatus: AdminVendorRowStatus;
  applicationStatusLabel: string;
  city: string;
  cnpj: string;
  coverageSummary: string;
  email: string;
  id: number;
  name: string;
  registeredAt: string;
  role: string;
  roleLabel: string;
  state: string;
  storeName: string;
};

export type AdminVendorsSummary = {
  approvedSellers: number;
  filteredUsers: number;
  pendingApplications: number;
  usersWithCoverage: number;
};

export type AdminVendorsSnapshot = {
  currentPage: number;
  issues: string[];
  perPage: number;
  rows: AdminVendorRow[];
  summary: AdminVendorsSummary;
  totalPages: number;
  totalRows: number;
};

export type AdminVendorReviewer = {
  email: string;
  id: number;
  name: string;
};

export type AdminVendorBankAccount = {
  accountCheckDigit: string;
  accountNumber: string;
  bankCode: string;
  branchCheckDigit: string;
  branchNumber: string;
  holderDocument: string;
  holderName: string;
  holderType: string;
  type: string;
};

export type AdminVendorDetail = {
  bankAccount: AdminVendorBankAccount | null;
  cep: string;
  city: string;
  cnpj: string;
  discoveryChannel: string;
  email: string;
  firstName: string;
  hasSoldPapelito: string;
  id: number;
  instagram: string;
  lastName: string;
  maxCep: string;
  maxCepRanges: string[];
  minCep: string;
  minCepRanges: string[];
  name: string;
  phoneNumber: string;
  registeredAt: string;
  rejectionReason: string;
  reviewedAt: string;
  reviewedBy: AdminVendorReviewer | null;
  state: string;
  status: string;
  storeName: string;
  submittedAt: string;
};

type RawSnapshotRow = Partial<AdminVendorRow> & { id?: number };

type RawSnapshot = {
  currentPage?: number;
  issues?: unknown[];
  perPage?: number;
  rows?: RawSnapshotRow[];
  summary?: Partial<AdminVendorsSummary>;
  totalPages?: number;
  totalRows?: number;
};

const EMPTY_SUMMARY: AdminVendorsSummary = {
  approvedSellers: 0,
  filteredUsers: 0,
  pendingApplications: 0,
  usersWithCoverage: 0,
};

function normalizeStatus(value: unknown): AdminVendorRow["applicationStatus"] {
  if (value === "pending" || value === "approved" || value === "rejected") {
    return value;
  }
  return "none";
}

function mapRow(raw: RawSnapshotRow): AdminVendorRow | null {
  const id = Number(raw.id ?? 0);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return {
    applicationStatus: normalizeStatus(raw.applicationStatus),
    applicationStatusLabel: String(raw.applicationStatusLabel ?? ""),
    city: String(raw.city ?? ""),
    cnpj: String(raw.cnpj ?? ""),
    coverageSummary: String(raw.coverageSummary ?? ""),
    email: String(raw.email ?? ""),
    id,
    name: String(raw.name ?? ""),
    registeredAt: String(raw.registeredAt ?? ""),
    role: String(raw.role ?? ""),
    roleLabel: String(raw.roleLabel ?? ""),
    state: String(raw.state ?? ""),
    storeName: String(raw.storeName ?? ""),
  };
}

export async function getAdminVendorsSnapshot(
  accessToken: string | undefined,
  filters: AdminVendorsFilters,
): Promise<AdminVendorsSnapshot> {
  const emptySnapshot: AdminVendorsSnapshot = {
    currentPage: filters.page,
    issues: [],
    perPage: filters.perPage,
    rows: [],
    summary: EMPTY_SUMMARY,
    totalPages: 1,
    totalRows: 0,
  };

  if (!accessToken) {
    return {
      ...emptySnapshot,
      issues: ["Sessao sem access token para consultar a lista de vendors."],
    };
  }

  const query = new URLSearchParams();
  query.set("status", filters.status);
  query.set("page", String(filters.page));
  query.set("perPage", String(filters.perPage));
  if (filters.search) {
    query.set("search", filters.search);
  }

  const result = await wpRest<RawSnapshot>(`/papelito/v1/admin/vendors?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-vendors"],
  });

  if (!result.ok) {
    return {
      ...emptySnapshot,
      issues: [`[wp] vendors -> ${result.error.message}`],
    };
  }

  const rows = (result.data.rows ?? [])
    .map(mapRow)
    .filter((row): row is AdminVendorRow => row !== null);

  const summary: AdminVendorsSummary = {
    approvedSellers: Number(result.data.summary?.approvedSellers ?? 0),
    filteredUsers: Number(result.data.summary?.filteredUsers ?? 0),
    pendingApplications: Number(result.data.summary?.pendingApplications ?? 0),
    usersWithCoverage: Number(result.data.summary?.usersWithCoverage ?? 0),
  };

  return {
    currentPage: Number(result.data.currentPage ?? filters.page),
    issues: [],
    perPage: Number(result.data.perPage ?? filters.perPage),
    rows,
    summary,
    totalPages: Math.max(1, Number(result.data.totalPages ?? 1)),
    totalRows: Number(result.data.totalRows ?? rows.length),
  };
}

export async function getAdminVendorDetail(
  accessToken: string | undefined,
  vendorId: number,
): Promise<AdminVendorDetail | null> {
  if (!accessToken || !Number.isFinite(vendorId) || vendorId <= 0) {
    return null;
  }

  const result = await wpRest<AdminVendorDetail>(
    `/papelito/v1/admin/vendors/${vendorId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!result.ok) {
    return null;
  }

  return result.data;
}
