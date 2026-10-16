import { isValidCep, isValidCnpj, isValidEmail } from "@/features/revendedor/utils/revendedor-formatters";
import {
  BANK_HOLDER_NAME_TOO_LONG_ERROR,
  isBankHolderNameTooLong,
  isValidCpf,
} from "@/features/revendedor/utils/revendedor-registration";

import type { FinancialProfile } from "../types/payment-gateways";

/** Endereço do representante legal no formulário financeiro. */
export type FinancialAddressValues = {
  zipCode: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

/** Conta PJ editável; titular e documento são sempre a empresa e o CNPJ da loja. */
export type FinancialBankValues = {
  holderName: string;
  bankCode: string;
  branchNumber: string;
  branchCheckDigit: string;
  accountNumber: string;
  accountCheckDigit: string;
  type: "checking" | "savings";
};

/**
 * Estado do formulário financeiro unificado. `document` e `birthdate` são write-only: começam
 * vazios e só vão ao backend quando o vendor digita um valor novo.
 */
export type FinancialFormValues = {
  companyName: string;
  tradingName: string;
  corporationType: string;
  foundingDate: string;
  annualRevenue: string;
  partner: {
    name: string;
    email: string;
    document: string;
    birthdate: string;
    motherName: string;
    monthlyIncome: string;
    professionalOccupation: string;
    selfDeclaredLegalRepresentative: boolean;
    address: FinancialAddressValues;
  };
  bankAccount: FinancialBankValues;
};

/** Erro por campo, com as mesmas chaves das pendências do backend (`partner.document`, …). */
export type FinancialFormErrors = Partial<Record<string, string>>;

/** Contexto que decide o que é enviado e validado. */
export type FinancialFormContext = {
  /** CNPJ cadastrado da loja; a conta PJ só fecha com ele. */
  cnpj: string;
  /** CNAE bloqueado: campos exclusivos da Pagar.me não são exigidos nem enviados. */
  pagarmeBlocked: boolean;
};

/** Edição pronta para o PATCH, já sem os campos que não mudaram. */
export type FinancialProfilePatch = {
  profile: Record<string, unknown>;
  /** Toca conta, CPF ou nascimento — o backend exige a senha atual. */
  sensitive: boolean;
  empty: boolean;
};

const COMPANY_KEYS = ["companyName", "tradingName", "corporationType", "foundingDate"] as const;
const PARTNER_COMMON_KEYS = ["name", "email"] as const;
const PARTNER_PAGARME_KEYS = ["motherName", "monthlyIncome", "professionalOccupation"] as const;
const ADDRESS_KEYS: readonly (keyof FinancialAddressValues)[] = [
  "zipCode",
  "street",
  "streetNumber",
  "complement",
  "neighborhood",
  "city",
  "state",
];
const BANK_KEYS: readonly (keyof FinancialBankValues)[] = [
  "holderName",
  "bankCode",
  "branchNumber",
  "branchCheckDigit",
  "accountNumber",
  "accountCheckDigit",
  "type",
];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function readAddress(address: Record<string, string>): FinancialAddressValues {
  return Object.fromEntries(ADDRESS_KEYS.map((key) => [key, address[key] ?? ""])) as FinancialAddressValues;
}

/** Converte o perfil público do backend no estado inicial do formulário, sem CPF nem nascimento. */
export function createFinancialFormValues(profile: FinancialProfile): FinancialFormValues {
  const data = profile.profile;
  const [partner] = data.managingPartners;
  const bank = data.bankAccount;

  return {
    companyName: data.companyName,
    tradingName: data.tradingName,
    corporationType: data.corporationType,
    foundingDate: data.foundingDate,
    annualRevenue: data.annualRevenue,
    partner: {
      name: partner?.name ?? "",
      email: partner?.email ?? "",
      document: "",
      birthdate: "",
      motherName: partner?.motherName ?? "",
      monthlyIncome: partner?.monthlyIncome ?? "",
      professionalOccupation: partner?.professionalOccupation ?? "",
      selfDeclaredLegalRepresentative: partner?.selfDeclaredLegalRepresentative ?? false,
      address: readAddress(partner?.address ?? {}),
    },
    bankAccount: {
      holderName: bank.holderName ?? "",
      bankCode: bank.bankCode ?? "",
      branchNumber: bank.branchNumber ?? "",
      branchCheckDigit: bank.branchCheckDigit ?? "",
      accountNumber: bank.accountNumber ?? "",
      accountCheckDigit: bank.accountCheckDigit ?? "",
      type: bank.type === "savings" ? "savings" : "checking",
    },
  };
}

function changedKeys<T extends Record<string, unknown>>(initial: T, values: T, keys: readonly (keyof T)[]) {
  return keys.filter((key) => initial[key] !== values[key]);
}

function pick<T extends Record<string, unknown>>(source: T, keys: readonly (keyof T)[]): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, source[key]]));
}

function trimmedEntries<T extends Record<string, unknown>>(source: T, keys: readonly (keyof T)[]) {
  return Object.fromEntries(
    keys.map((key) => {
      const value = source[key];
      return [key, typeof value === "string" ? value.trim() : value];
    }),
  );
}

/** Diz se a conta PJ mudou em relação ao que foi lido. */
export function bankAccountChanged(initial: FinancialFormValues, values: FinancialFormValues): boolean {
  return changedKeys(initial.bankAccount, values.bankAccount, BANK_KEYS).length > 0;
}

function buildPartnerPatch(initial: FinancialFormValues, values: FinancialFormValues, pagarmeBlocked: boolean) {
  const partnerKeys = pagarmeBlocked ? PARTNER_COMMON_KEYS : [...PARTNER_COMMON_KEYS, ...PARTNER_PAGARME_KEYS];
  const patch: Record<string, unknown> = trimmedEntries(values.partner, changedKeys(initial.partner, values.partner, partnerKeys));

  if (initial.partner.selfDeclaredLegalRepresentative !== values.partner.selfDeclaredLegalRepresentative) {
    patch.selfDeclaredLegalRepresentative = values.partner.selfDeclaredLegalRepresentative;
  }

  if (pagarmeBlocked) return patch;

  const addressKeys = changedKeys(initial.partner.address, values.partner.address, ADDRESS_KEYS);
  if (addressKeys.length > 0) patch.address = trimmedEntries(values.partner.address, addressKeys);
  if (values.partner.document.trim()) patch.document = onlyDigits(values.partner.document);
  if (values.partner.birthdate.trim()) patch.birthdate = values.partner.birthdate.trim();

  return patch;
}

/**
 * Monta o corpo `profile` do PATCH com só o que mudou. Conta PJ vai inteira, presa à empresa e ao
 * CNPJ da loja; CPF e nascimento só quando digitados. Com CNAE bloqueado, nada exclusivo da
 * Pagar.me é enviado.
 */
export function buildFinancialProfilePatch(
  initial: FinancialFormValues,
  values: FinancialFormValues,
  context: FinancialFormContext,
): FinancialProfilePatch {
  const companyKeys = context.pagarmeBlocked ? COMPANY_KEYS : [...COMPANY_KEYS, "annualRevenue" as const];
  const profile: Record<string, unknown> = trimmedEntries(values, changedKeys(initial, values, companyKeys));
  const partner = buildPartnerPatch(initial, values, context.pagarmeBlocked);
  const includeBank = !context.pagarmeBlocked && bankAccountChanged(initial, values);

  if (Object.keys(partner).length > 0) profile.managingPartners = [partner];
  if (includeBank) {
    profile.bankAccount = {
      ...pick(trimmedEntries(values.bankAccount, BANK_KEYS), BANK_KEYS),
      holderType: "company",
      holderDocument: onlyDigits(context.cnpj),
    };
  }

  const sensitive = includeBank || "document" in partner || "birthdate" in partner;

  return { profile, sensitive, empty: Object.keys(profile).length === 0 };
}

function isPastIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && date.getTime() < Date.now();
}

function validateSensitive(values: FinancialFormValues, errors: FinancialFormErrors) {
  const document = values.partner.document.trim();
  const birthdate = values.partner.birthdate.trim();

  if (document && !isValidCpf(document)) errors["partner.document"] = "Digite o CPF completo e válido do representante.";
  if (birthdate && !isPastIsoDate(birthdate)) errors["partner.birthdate"] = "Informe uma data de nascimento válida.";
}

function validateBank(values: FinancialFormValues, context: FinancialFormContext, errors: FinancialFormErrors) {
  const bank = values.bankAccount;

  if (!bank.holderName.trim()) errors["bankAccount.holderName"] = "Informe o titular da conta.";
  else if (isBankHolderNameTooLong(bank.holderName)) errors["bankAccount.holderName"] = BANK_HOLDER_NAME_TOO_LONG_ERROR;
  if (!isValidCnpj(context.cnpj)) {
    errors["bankAccount.holderDocument"] = "Não conseguimos ler o CNPJ da loja para a conta PJ. Recarregue a página.";
  }
  if (!/^\d{3}$/.test(bank.bankCode.trim())) errors["bankAccount.bankCode"] = "Informe o código do banco com 3 dígitos.";
  if (!/^\d+$/.test(bank.branchNumber.trim())) errors["bankAccount.branchNumber"] = "Informe uma agência válida.";
  if (!/^\d+$/.test(bank.accountNumber.trim())) errors["bankAccount.accountNumber"] = "Informe uma conta válida.";
  if (!/^[0-9A-Za-z]+$/.test(bank.accountCheckDigit.trim())) {
    errors["bankAccount.accountCheckDigit"] = "Informe o dígito da conta.";
  }
}

function validateChangedCommon(initial: FinancialFormValues, values: FinancialFormValues, errors: FinancialFormErrors) {
  if (initial.partner.email !== values.partner.email && !isValidEmail(values.partner.email)) {
    errors["partner.email"] = "Informe um e-mail válido.";
  }
  if (initial.companyName !== values.companyName && !values.companyName.trim()) {
    errors.companyName = "Informe a razão social.";
  }
}

function validateChangedPagarme(initial: FinancialFormValues, values: FinancialFormValues, errors: FinancialFormErrors) {
  const zipCode = values.partner.address.zipCode;

  if (initial.partner.address.zipCode !== zipCode && !isValidCep(zipCode)) {
    errors["partner.address.zipCode"] = "Informe um CEP válido.";
  }
}

/**
 * Valida o formato do que o vendor alterou, com as mesmas regras do cadastro Pagar.me. Campo
 * não tocado não é exigido aqui: o que falta para cada gateway vem das pendências do backend.
 */
export function validateFinancialForm(
  initial: FinancialFormValues,
  values: FinancialFormValues,
  context: FinancialFormContext,
): FinancialFormErrors {
  const errors: FinancialFormErrors = {};

  validateChangedCommon(initial, values, errors);
  if (context.pagarmeBlocked) return errors;

  validateSensitive(values, errors);
  validateChangedPagarme(initial, values, errors);
  if (bankAccountChanged(initial, values)) validateBank(values, context, errors);

  return errors;
}
