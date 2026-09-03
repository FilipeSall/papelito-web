import type { VendorRegistrationStep3Data } from "@/features/revendedor/types/revendedor-application";
import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";

export type CoverageRange = { minCep: string; maxCep: string };

export type VendorCreateForm = Omit<
  AdminVendorCreatePayload,
  "coverageRanges" | "bankAccount" | "pagarmeDraft"
> & {
  coverageRanges: CoverageRange[];
  bankAccount: AdminVendorCreatePayload["bankAccount"];
  pagarmeDraft: VendorRegistrationStep3Data;
};

export type CreatedVendor = {
  email?: string;
  id?: number;
  storeName?: string;
};

export type CepStatus = {
  message: string;
  tone: "error" | "info";
};

export type VendorCreateSourceUser = {
  cep: string;
  city: string;
  cnpj: string;
  complement: string;
  email: string;
  firstName: string;
  id: number;
  instagram: string;
  lastName: string;
  name: string;
  neighborhood: string;
  number: string;
  phoneNumber: string;
  state: string;
  storeName: string;
  street: string;
};

export type VendorCreateLauncherProps = Readonly<{
  hideHeading?: boolean;
  initialOpen?: boolean;
  sourceUser?: VendorCreateSourceUser | null;
}>;
