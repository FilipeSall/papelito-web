import "server-only";

import { wpRest } from "./wp-rest";

export type AdminVendorInterest = {
  id: number;
  customerUserId: number;
  storeName: string;
  firstName: string;
  lastName: string;
  cnpj: string;
  phone: string;
  email: string;
  instagram: string;
  discoveryChannel: string;
  hasSoldPapelito: string;
  createdAt: string;
  customer?: {
    id: number;
    displayName: string;
    email: string;
  };
};

export type AdminVendorInterestsSnapshot = {
  items: AdminVendorInterest[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  issue?: string;
};

export async function getAdminVendorInterests(
  accessToken: string | undefined,
  filters: { page: number; perPage: number; search: string },
): Promise<AdminVendorInterestsSnapshot> {
  const empty = {
    items: [],
    page: filters.page,
    perPage: filters.perPage,
    total: 0,
    totalPages: 1,
  };

  if (!accessToken) return { ...empty, issue: "Sessão administrativa indisponível." };

  const query = new URLSearchParams({
    page: String(filters.page),
    perPage: String(filters.perPage),
  });
  if (filters.search) query.set("search", filters.search);

  const result = await wpRest<AdminVendorInterestsSnapshot>(
    `/papelito/v1/admin/vendor-interests?${query.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!result.ok) return { ...empty, issue: result.error.message };

  return {
    items: Array.isArray(result.data.items) ? result.data.items : [],
    page: Number(result.data.page || filters.page),
    perPage: Number(result.data.perPage || filters.perPage),
    total: Number(result.data.total || 0),
    totalPages: Math.max(1, Number(result.data.totalPages || 1)),
  };
}

export async function getAdminVendorInterest(
  accessToken: string | undefined,
  interestId: number,
): Promise<AdminVendorInterest | null> {
  if (!accessToken || interestId <= 0) return null;

  const result = await wpRest<AdminVendorInterest>(
    `/papelito/v1/admin/vendor-interests/${interestId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return result.ok ? result.data : null;
}

