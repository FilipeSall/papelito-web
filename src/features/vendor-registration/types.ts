import type {
  VendorCoverageRange,
  VendorRegistrationStep3Data,
} from "@/features/revendedor/types/revendedor-application";

export type VendorFormMode = "admin-create" | "admin-edit" | "vendor-self";

export type VendorFormBankAccount = VendorRegistrationStep3Data["bankAccount"];

export type VendorFormValues = {
  bankAccount: VendorFormBankAccount;
  cep: string;
  city: string;
  cnpj: string;
  complement: string;
  coverageRanges: VendorCoverageRange[];
  discoveryChannel: string;
  email: string;
  firstName: string;
  hasSoldPapelito: string;
  instagram: string;
  lastName: string;
  neighborhood: string;
  number: string;
  pagarmeDraft: VendorRegistrationStep3Data;
  phoneNumber: string;
  sourceUserId?: number;
  state: string;
  storeName: string;
  street: string;
  temporaryPassword: string;
};

export type VendorFormCepStatus = {
  message: string;
  tone: "error" | "info";
};

export type VendorFormSourceUser = {
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
