export const VENDOR_PENDING_SECTION_ORDER = [
  "company",
  "partner",
  "bank",
] as const;

export type VendorPendingSectionKey = (typeof VENDOR_PENDING_SECTION_ORDER)[number];

export const VENDOR_PENDING_FIELD_KEYS = [
  "companyName",
  "tradingName",
  "corporationType",
  "foundingDate",
  "annualRevenue",
  "partner.name",
  "partner.email",
  "partner.document",
  "partner.motherName",
  "partner.birthdate",
  "partner.monthlyIncome",
  "partner.professionalOccupation",
  "partner.address.zipCode",
  "partner.address.street",
  "partner.address.streetNumber",
  "partner.address.neighborhood",
  "partner.address.city",
  "partner.address.state",
  "bankAccount.holderName",
  "bankAccount.holderDocument",
  "bankAccount.bankCode",
  "bankAccount.branchNumber",
  "bankAccount.accountNumber",
  "bankAccount.accountCheckDigit",
] as const;

export type VendorPendingFieldKey = (typeof VENDOR_PENDING_FIELD_KEYS)[number];

export const VENDOR_PENDING_SECTION_LABELS: Record<VendorPendingSectionKey, string> = {
  company: "KYC da empresa",
  partner: "Socio administrador / responsavel legal",
  bank: "Dados bancarios",
};

export const VENDOR_PENDING_FIELD_LABELS: Record<VendorPendingFieldKey, string> = {
  companyName: "Razao social",
  tradingName: "Nome fantasia",
  corporationType: "Natureza juridica",
  foundingDate: "Data de fundacao",
  annualRevenue: "Faturamento anual",
  "partner.name": "Nome do socio administrador",
  "partner.email": "E-mail do socio administrador",
  "partner.document": "CPF do socio administrador",
  "partner.motherName": "Nome da mae do socio administrador",
  "partner.birthdate": "Data de nascimento do socio administrador",
  "partner.monthlyIncome": "Renda mensal do socio administrador",
  "partner.professionalOccupation": "Ocupacao profissional do socio administrador",
  "partner.address.zipCode": "CEP do socio administrador",
  "partner.address.street": "Logradouro do socio administrador",
  "partner.address.streetNumber": "Numero do endereco do socio administrador",
  "partner.address.neighborhood": "Bairro do socio administrador",
  "partner.address.city": "Cidade do socio administrador",
  "partner.address.state": "Estado do socio administrador",
  "bankAccount.holderName": "Titular da conta",
  "bankAccount.holderDocument": "Documento do titular",
  "bankAccount.bankCode": "Codigo do banco",
  "bankAccount.branchNumber": "Agencia",
  "bankAccount.accountNumber": "Conta",
  "bankAccount.accountCheckDigit": "Digito da conta",
};

export const VENDOR_PENDING_FIELD_SECTIONS: Record<VendorPendingFieldKey, VendorPendingSectionKey> = {
  companyName: "company",
  tradingName: "company",
  corporationType: "company",
  foundingDate: "company",
  annualRevenue: "company",
  "partner.name": "partner",
  "partner.email": "partner",
  "partner.document": "partner",
  "partner.motherName": "partner",
  "partner.birthdate": "partner",
  "partner.monthlyIncome": "partner",
  "partner.professionalOccupation": "partner",
  "partner.address.zipCode": "partner",
  "partner.address.street": "partner",
  "partner.address.streetNumber": "partner",
  "partner.address.neighborhood": "partner",
  "partner.address.city": "partner",
  "partner.address.state": "partner",
  "bankAccount.holderName": "bank",
  "bankAccount.holderDocument": "bank",
  "bankAccount.bankCode": "bank",
  "bankAccount.branchNumber": "bank",
  "bankAccount.accountNumber": "bank",
  "bankAccount.accountCheckDigit": "bank",
};

export function isVendorPendingFieldKey(value: string): value is VendorPendingFieldKey {
  return VENDOR_PENDING_FIELD_KEYS.includes(value as VendorPendingFieldKey);
}
