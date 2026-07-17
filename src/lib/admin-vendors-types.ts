import type { VendorRegistrationStep3Data } from "@/features/revendedor/types/revendedor-application";

export type AdminVendorCreatePayload = {
  sourceUserId?: number;
  email: string;
  temporaryPassword: string;
  storeName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  cnpj: string;
  instagram?: string;
  state?: string;
  city?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  discoveryChannel?: string;
  hasSoldPapelito?: string;
  coverageRanges: Array<{ minCep: string; maxCep: string }>;
  bankAccount: {
    holderName: string;
    holderType: "company" | "individual";
    holderDocument: string;
    bankCode: string;
    branchNumber: string;
    branchCheckDigit?: string;
    accountNumber: string;
    accountCheckDigit: string;
    type: "checking" | "savings";
  };
  pagarmeDraft: VendorRegistrationStep3Data;
};
