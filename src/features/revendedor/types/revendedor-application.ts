import type { RevendedorSoldOption } from "./revendedor";
export type VendorRegistrationStep1Data = {
  storeName: string;
  firstName: string;
  lastName: string;
  cnpj: string;
  phone: string;
  email: string;
  instagram: string;
  hasSoldPapelito: RevendedorSoldOption;
  discoveryChannel: string;
};

export type VendorRegistrationAddress = {
  zipCode: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type VendorRegistrationStep2Data = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  minCep: string;
  maxCep: string;
  coverageRanges: VendorCoverageRange[];
};

export type VendorCoverageRange = {
  minCep: string;
  maxCep: string;
};

export type VendorManagingPartner = {
  name: string;
  email: string;
  document: string;
  motherName: string;
  birthdate: string;
  monthlyIncome: string;
  professionalOccupation: string;
  selfDeclaredLegalRepresentative: boolean;
  address: VendorRegistrationAddress;
};

export type VendorBankAccount = {
  holderName: string;
  holderType: "company" | "individual";
  holderDocument: string;
  bankCode: string;
  branchNumber: string;
  branchCheckDigit: string;
  accountNumber: string;
  accountCheckDigit: string;
  type: "checking" | "savings";
};

export type VendorTransferSettings = {
  interval: "Daily";
  day: 0;
};

export type VendorRegistrationStep3Data = {
  companyName: string;
  tradingName: string;
  corporationType: string;
  corporationTypeOther: string;
  corporationTypeSelection: string;
  foundingDate: string;
  annualRevenue: string;
  hasManagingPartner: "yes" | "no";
  managingPartners: VendorManagingPartner[];
  bankAccount: VendorBankAccount;
  transfer: VendorTransferSettings;
};

export type VendorRegistrationStep3SubmitData = Omit<
  VendorRegistrationStep3Data,
  "corporationTypeOther" | "corporationTypeSelection" | "hasManagingPartner"
>;

export type VendorRegistrationDraft = {
  version: 1;
  currentStep: 1 | 2 | 3;
  step1: VendorRegistrationStep1Data;
  step2: VendorRegistrationStep2Data;
  step3: VendorRegistrationStep3Data;
  updatedAt: string;
};

export type SubmitRevendedorApplicationInput = {
  step1: VendorRegistrationStep1Data;
  step2: VendorRegistrationStep2Data;
  step3: VendorRegistrationStep3SubmitData;
};

export type VendorPendingRegistrationResponse = {
  application?: {
    step1: VendorRegistrationStep1Data;
    step2: VendorRegistrationStep2Data;
    coverageRanges?: VendorCoverageRange[] | null;
  };
  draft: VendorRegistrationStep3Data | null;
  pendingFields: string[];
  updatedAt?: string;
};

export type UpdateVendorPendingRegistrationInput = {
  application: {
    step1: VendorRegistrationStep1Data;
    step2: VendorRegistrationStep2Data;
    coverageRanges: VendorCoverageRange[];
  };
  draft: VendorRegistrationStep3Data;
};

export type RevendedorStep1Errors = Partial<Record<keyof VendorRegistrationStep1Data, string>>;
export type RevendedorStep2Errors = Partial<Record<keyof VendorRegistrationStep2Data, string>>;
export type VendorPartnerAddressErrors = Partial<
  Record<keyof VendorRegistrationAddress, string>
>;
export type VendorManagingPartnerErrors = Partial<
  Record<
    | Exclude<keyof VendorManagingPartner, "selfDeclaredLegalRepresentative" | "address">
    | "selfDeclaredLegalRepresentative",
    string
  >
> & {
  address?: VendorPartnerAddressErrors;
};
export type VendorBankAccountErrors = Partial<Record<keyof VendorBankAccount, string>>;
export type RevendedorStep3Errors = Partial<
  Record<
    Exclude<keyof VendorRegistrationStep3Data, "managingPartners" | "bankAccount" | "transfer">,
    string
  >
> & {
  managingPartners?: VendorManagingPartnerErrors[];
  bankAccount?: VendorBankAccountErrors;
  form?: string;
};
