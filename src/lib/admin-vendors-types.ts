export type AdminVendorCreatePayload = {
  email: string;
  storeName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  cnpj: string;
  instagram?: string;
  state?: string;
  city?: string;
  cep?: string;
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
};

