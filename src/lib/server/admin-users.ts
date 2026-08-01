import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type { AdminUsersFilters } from "@/lib/server/admin-users-filters";

export type AdminUserRow = {
  accountStatus: string;
  accountStatusLabel: string;
  email: string;
  favoritesCount: number;
  id: number | string;
  isVendor: boolean;
  name: string;
  ordersCount: number;
  purchasesCount: number;
  recordType: "pre_account_application" | "user";
  registeredAt: string;
  role: string;
  roleLabel: string;
  salesCount: number;
  supportTicketsCount: number;
};

export type AdminUsersSummary = {
  adminsCount: number;
  customersCount: number;
  othersCount: number;
  sellersCount: number;
  totalUsers: number;
};

export type AdminUsersSnapshot = {
  currentPage: number;
  issues: string[];
  perPage: number;
  rows: AdminUserRow[];
  summary: AdminUsersSummary;
  totalPages: number;
  totalRows: number;
};

export type AdminUserRelatedOrder = {
  cancelReason: string;
  createdAt: string;
  customerName: string;
  id: number;
  isCancelled: boolean;
  itemsCount: number;
  itemsLabel: string;
  orderNumber: string;
  relationship: "purchase" | "sale";
  relationshipLabel: string;
  status: string;
  total: number;
  vendorStatus: string;
};

export type AdminUserDetail = {
  accountStatus: string;
  accountStatusLabel: string;
  availableActions: {
    canCancelOrders: boolean;
    canConvertSellerToCustomer: boolean;
    canDemoteAdministrator: boolean;
    canPromoteToAdministrator: boolean;
    canUseVendorRedirect: boolean;
    currentRole: string;
    isSelf: boolean;
  };
  cancelledOrders: AdminUserRelatedOrder[];
  cep: string;
  city: string;
  cnpj: string;
  complement: string;
  displayName: string;
  email: string;
  emailVerificationStatus: string;
  favoritesCount?: number;
  firstName: string;
  id: number;
  instagram: string;
  isVendor: boolean;
  lastName: string;
  metrics: {
    cancelledOrdersCount: number;
    favoritesCount: number;
    ordersCount: number;
    purchasesCount: number;
    salesCount: number;
    supportTicketsCount: number;
  };
  name: string;
  neighborhood: string;
  number: string;
  phoneNumber: string;
  recentPurchases: AdminUserRelatedOrder[];
  recentSales: AdminUserRelatedOrder[];
  registeredAt: string;
  role: string;
  roleLabel: string;
  roles: string[];
  state: string;
  storeName: string;
  street: string;
  supportTicketsCount?: number;
  vendorData: {
    bankAccount: {
      accountCheckDigit: string;
      accountNumber: string;
      bankCode: string;
      branchCheckDigit: string;
      branchNumber: string;
      holderDocument: string;
      holderName: string;
      holderType: string;
      type: string;
    } | null;
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
    reviewedBy: {
      email: string;
      id: number;
      name: string;
    } | null;
    state: string;
    status: string;
    storeName: string;
    submittedAt: string;
  } | null;
};

export type AdminCompanyApplicationDetail = {
  application: {
    applicationId: string | number;
    companyId: number | null;
    attemptNumber: number;
    status: "document_required" | "pending_manual_review" | "auto_approved" | "approved" | "rejected";
    fileName: string | null;
    submittedAt: string | null;
    decidedAt: string | null;
    canUpload: boolean;
    canRestart: boolean;
    documentMime: string | null;
    documentSize: number | null;
    documentAvailable: boolean;
    documentPurgeStatus: string;
    rejectionReason: string | null;
    decidedByUserId: number | null;
  };
  person: {
    userId: number | null;
    fullName: string | null;
    email: string | null;
    cpf: string | null;
    birthDate: string | null;
    phone: string | null;
  };
  company: {
    id: number | null;
    cnpj: string;
    legalName: string | null;
    tradeName: string | null;
    registryStatus: string | null;
    ownershipStatus: string | null;
    companyStatus: string | null;
    providerSource: string | null;
    providerCheckedAt: string | null;
    fiscalAddress: {
      cep: string | null;
      state: string | null;
      city: string | null;
      neighborhood: string | null;
      street: string | null;
      number: string | null;
      complement: string | null;
    };
  };
  membership: { role: string; status: string } | null;
  evidence: Record<string, unknown>;
};

export type AdminOwnerApplicationDetail = AdminCompanyApplicationDetail;

export type AdminOwnerApplications = {
  current: AdminOwnerApplicationDetail | null;
  history: AdminOwnerApplicationDetail[];
};

type RawUsersSnapshot = {
  currentPage?: unknown;
  issues?: unknown[];
  perPage?: unknown;
  rows?: unknown[];
  summary?: Partial<AdminUsersSummary>;
  totalPages?: unknown;
  totalRows?: unknown;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRow(raw: unknown): AdminUserRow | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const recordType =
    row.recordType === "pre_account_application" ? "pre_account_application" : "user";
  const rawId = row.id;
  const id =
    recordType === "pre_account_application"
      ? typeof rawId === "string" && /^pre:\d+$/.test(rawId)
        ? rawId
        : null
      : toNumber(rawId);

  if (id === null || (typeof id === "number" && id <= 0)) return null;

  return {
    accountStatus: String(row.accountStatus ?? ""),
    accountStatusLabel: String(row.accountStatusLabel ?? ""),
    email: String(row.email ?? ""),
    favoritesCount: toNumber(row.favoritesCount),
    id,
    isVendor: Boolean(row.isVendor),
    name: String(row.name ?? ""),
    ordersCount: toNumber(row.ordersCount),
    purchasesCount: toNumber(row.purchasesCount),
    recordType,
    registeredAt: String(row.registeredAt ?? ""),
    role: String(row.role ?? ""),
    roleLabel: String(row.roleLabel ?? ""),
    salesCount: toNumber(row.salesCount),
    supportTicketsCount: toNumber(row.supportTicketsCount),
  };
}

function parsePreAccountApplicationId(value: string | undefined) {
  const match = /^pre:(\d+)$/.exec(value ?? "");
  return match ? Number.parseInt(match[1], 10) : 0;
}

function emptySnapshot(filters: AdminUsersFilters): AdminUsersSnapshot {
  return {
    currentPage: filters.page,
    issues: [],
    perPage: filters.perPage,
    rows: [],
    summary: {
      adminsCount: 0,
      customersCount: 0,
      othersCount: 0,
      sellersCount: 0,
      totalUsers: 0,
    },
    totalPages: 1,
    totalRows: 0,
  };
}

export async function getAdminUsersSnapshot(
  accessToken: string | undefined,
  filters: AdminUsersFilters,
): Promise<AdminUsersSnapshot> {
  const empty = emptySnapshot(filters);

  if (!accessToken) {
    return {
      ...empty,
      issues: ["Sessão sem access token para consultar usuários."],
    };
  }

  const query = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
  });

  if (filters.role !== "all") {
    query.set("role", filters.role);
  }

  if (filters.search) {
    query.set("search", filters.search);
  }

  const result = await wpRest<RawUsersSnapshot>(
    `/papelito/v1/admin/users?${query.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!result.ok) {
    return {
      ...empty,
      issues: [`[wp] users -> ${result.error.message}`],
    };
  }

  return {
    currentPage: toNumber(result.data.currentPage, filters.page),
    issues: Array.isArray(result.data.issues)
      ? result.data.issues.map((issue) => String(issue)).filter(Boolean)
      : [],
    perPage: toNumber(result.data.perPage, filters.perPage),
    rows: Array.isArray(result.data.rows) ? result.data.rows.map(mapRow).filter(Boolean) as AdminUserRow[] : [],
    summary: {
      adminsCount: toNumber(result.data.summary?.adminsCount),
      customersCount: toNumber(result.data.summary?.customersCount),
      othersCount: toNumber(result.data.summary?.othersCount),
      sellersCount: toNumber(result.data.summary?.sellersCount),
      totalUsers: toNumber(result.data.summary?.totalUsers),
    },
    totalPages: Math.max(1, toNumber(result.data.totalPages, 1)),
    totalRows: toNumber(result.data.totalRows),
  };
}

export async function getAdminUserDetail(
  accessToken: string | undefined,
  userId: number,
): Promise<AdminUserDetail | null> {
  if (!accessToken || !Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  const result = await wpRest<AdminUserDetail>(`/papelito/v1/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? result.data : null;
}

export async function getAdminOwnerApplications(
  accessToken: string | undefined,
  userId: number,
): Promise<AdminOwnerApplications> {
  if (!accessToken || !Number.isFinite(userId) || userId <= 0) {
    return { current: null, history: [] };
  }

  const result = await wpRest<AdminOwnerApplications>(
    `/papelito/v1/admin/users/${userId}/owner-applications`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return result.ok ? result.data : { current: null, history: [] };
}

export async function getAdminPreAccountApplication(
  accessToken: string | undefined,
  externalApplicationId: string | undefined,
): Promise<AdminOwnerApplicationDetail | null> {
  const applicationId = parsePreAccountApplicationId(externalApplicationId);
  if (!accessToken || applicationId <= 0) return null;

  const result = await wpRest<AdminOwnerApplicationDetail>(
    `/papelito/v1/admin/pre-account-applications/${applicationId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return result.ok ? result.data : null;
}
