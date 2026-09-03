import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

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
  state: string;
  storeName: string;
};

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
