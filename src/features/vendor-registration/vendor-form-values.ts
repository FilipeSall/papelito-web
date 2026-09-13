import {
  VENDOR_PENDING_FIELD_KEYS,
  type VendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";
import type {
  UpdateVendorPendingRegistrationInput,
  VendorPendingRegistrationResponse,
  VendorRegistrationStep3Data,
} from "@/features/revendedor/types/revendedor-application";
import {
  formatCep,
  isValidCep,
  isValidCnpj,
  isValidEmail,
  isValidPhone,
} from "@/features/revendedor/utils/revendedor-formatters";
import {
  createEmptyStep1Data,
  createEmptyStep2Data,
  createEmptyStep3Data,
  isValidCpf,
  normalizeStep1Data,
  normalizeStep2Data,
  normalizeStep3Data,
  validateStep3,
} from "@/features/revendedor/utils/revendedor-registration";
import { validateCoverageRanges } from "@/features/vendor-coverage/coverage-presets";
import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";

import type { VendorFormMode, VendorFormSourceUser, VendorFormValues } from "./types";

export function digits(value: string, max?: number) {
  const clean = value.replace(/\D/g, "");
  return typeof max === "number" ? clean.slice(0, max) : clean;
}

export function createEmptyVendorFormValues(): VendorFormValues {
  return {
    bankAccount: createEmptyStep3Data().bankAccount,
    cep: "",
    city: "",
    cnpj: "",
    complement: "",
    coverageRanges: [{ minCep: "", maxCep: "" }],
    discoveryChannel: "",
    email: "",
    firstName: "",
    hasSoldPapelito: "",
    instagram: "",
    lastName: "",
    neighborhood: "",
    number: "",
    pagarmeDraft: createEmptyStep3Data(),
    phoneNumber: "",
    sourceUserId: undefined,
    state: "",
    storeName: "",
    street: "",
    temporaryPassword: "",
  };
}

export function createVendorFormValuesFromSourceUser(
  sourceUser?: VendorFormSourceUser | null,
): VendorFormValues {
  const values = createEmptyVendorFormValues();
  if (!sourceUser) return values;

  const fullName = `${sourceUser.firstName} ${sourceUser.lastName}`.trim() || sourceUser.name.trim();
  const storeName = sourceUser.storeName.trim() || fullName;
  const partner = values.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];

  return {
    ...values,
    bankAccount: {
      ...values.bankAccount,
      holderDocument: sourceUser.cnpj.trim(),
      holderName: storeName || fullName,
    },
    cep: sourceUser.cep.trim(),
    city: sourceUser.city.trim(),
    cnpj: sourceUser.cnpj.trim(),
    complement: sourceUser.complement.trim(),
    email: sourceUser.email.trim(),
    firstName: sourceUser.firstName.trim(),
    instagram: sourceUser.instagram.trim(),
    lastName: sourceUser.lastName.trim(),
    neighborhood: sourceUser.neighborhood.trim(),
    number: sourceUser.number.trim(),
    pagarmeDraft: {
      ...values.pagarmeDraft,
      managingPartners: [
        {
          ...partner,
          address: {
            ...partner.address,
            city: sourceUser.city.trim(),
            complement: sourceUser.complement.trim(),
            neighborhood: sourceUser.neighborhood.trim(),
            state: sourceUser.state.trim(),
            street: sourceUser.street.trim(),
            streetNumber: sourceUser.number.trim(),
            zipCode: sourceUser.cep.trim(),
          },
          email: sourceUser.email.trim(),
          name: fullName,
        },
      ],
    },
    phoneNumber: sourceUser.phoneNumber.trim(),
    sourceUserId: sourceUser.id,
    state: sourceUser.state.trim(),
    storeName,
    street: sourceUser.street.trim(),
  };
}

export function createVendorFormValuesFromRegistration(
  payload: VendorPendingRegistrationResponse,
): VendorFormValues {
  const step1 = normalizeStep1Data(payload.application?.step1 ?? createEmptyStep1Data());
  const step2 = normalizeStep2Data(payload.application?.step2 ?? createEmptyStep2Data());
  const pagarmeDraft = normalizeStep3Data(payload.draft ?? createEmptyStep3Data());

  return {
    bankAccount: pagarmeDraft.bankAccount,
    cep: step2.cep,
    city: step2.city,
    cnpj: step1.cnpj,
    complement: step2.complement,
    coverageRanges: resolveCoverageRanges(payload, step2),
    discoveryChannel: step1.discoveryChannel,
    email: step1.email,
    firstName: step1.firstName,
    hasSoldPapelito: step1.hasSoldPapelito,
    instagram: step1.instagram,
    lastName: step1.lastName,
    neighborhood: step2.neighborhood,
    number: step2.number,
    pagarmeDraft,
    phoneNumber: step1.phone,
    sourceUserId: undefined,
    state: step2.state,
    storeName: step1.storeName,
    street: step2.street,
    temporaryPassword: "",
  };
}

export function getDocumentError(value: string, kind: "cnpj" | "cpf"): string | undefined {
  const expectedLength = kind === "cnpj" ? 14 : 11;
  if (value.replace(/\D/g, "").length < expectedLength) return undefined;

  const isValid = kind === "cnpj" ? isValidCnpj(value) : isValidCpf(value);
  if (isValid) return undefined;

  return kind === "cnpj"
    ? "CNPJ inválido: os dígitos verificadores não conferem."
    : "CPF inválido: os dígitos verificadores não conferem.";
}

export function getInvalidVendorPendingFields(values: VendorFormValues): VendorPendingFieldKey[] {
  const partner =
    values.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
  const errors = validateStep3({
    ...values.pagarmeDraft,
    bankAccount: values.bankAccount,
    managingPartners: [partner],
  });
  const partnerErrors = errors.managingPartners?.[0] ?? {};
  const addressErrors = partnerErrors.address ?? {};
  const bankErrors = errors.bankAccount ?? {};
  const invalidByField: Record<VendorPendingFieldKey, boolean> = {
    annualRevenue: Boolean(errors.annualRevenue),
    "bankAccount.accountCheckDigit": Boolean(bankErrors.accountCheckDigit),
    "bankAccount.accountNumber": Boolean(bankErrors.accountNumber),
    "bankAccount.bankCode": Boolean(bankErrors.bankCode),
    "bankAccount.branchNumber": Boolean(bankErrors.branchNumber),
    "bankAccount.holderDocument":
      Boolean(bankErrors.holderDocument) || !bankHolderMatchesRecipient(values),
    "bankAccount.holderName": Boolean(bankErrors.holderName),
    companyName: Boolean(errors.companyName),
    "partner.address.city": Boolean(addressErrors.city),
    "partner.address.neighborhood": Boolean(addressErrors.neighborhood),
    "partner.address.state": Boolean(addressErrors.state),
    "partner.address.street": Boolean(addressErrors.street),
    "partner.address.streetNumber": Boolean(addressErrors.streetNumber),
    "partner.address.zipCode": Boolean(addressErrors.zipCode),
    "partner.birthdate": Boolean(partnerErrors.birthdate),
    "partner.document": Boolean(partnerErrors.document),
    "partner.email": Boolean(partnerErrors.email),
    "partner.monthlyIncome": Boolean(partnerErrors.monthlyIncome),
    "partner.name": Boolean(partnerErrors.name),
    "partner.professionalOccupation": Boolean(partnerErrors.professionalOccupation),
    phoneNumber: !isValidPhone(values.phoneNumber),
    tradingName: Boolean(errors.tradingName),
  };

  return VENDOR_PENDING_FIELD_KEYS.filter((field) => invalidByField[field]);
}

export function bankHolderMatchesRecipient(values: VendorFormValues) {
  const holderDocument = digits(values.bankAccount.holderDocument);

  return (
    values.bankAccount.holderType === "company" &&
    holderDocument !== "" &&
    holderDocument === digits(values.cnpj)
  );
}

export function validateVendorFormValues(
  values: VendorFormValues,
  mode: VendorFormMode,
): string | null {
  if (!isValidEmail(values.email)) return "Informe um e-mail válido.";
  if (mode === "admin-create" && !values.sourceUserId && !values.temporaryPassword.trim()) {
    return "Informe uma senha temporária para o vendor.";
  }
  if (!values.storeName.trim()) return "Informe o nome da loja.";
  if (!isValidCnpj(values.cnpj)) return "Informe um CNPJ válido.";
  if (!isValidPhone(values.phoneNumber)) return "Informe um telefone com DDD.";
  if (!isValidCep(values.cep)) return "Informe um CEP válido para a loja.";
  if (!values.street.trim()) return "Informe o logradouro da loja.";
  if (!values.number.trim()) return "Informe o número da loja.";
  if (!values.neighborhood.trim()) return "Informe o bairro da loja.";
  if (!values.city.trim()) return "Informe a cidade da loja.";
  if (!values.state.trim()) return "Informe o estado da loja.";

  return validateCoverageRanges(values.coverageRanges);
}

export function buildVendorCreatePayload(values: VendorFormValues): AdminVendorCreatePayload {
  return {
    bankAccount: trimBankAccount(values),
    cep: values.cep.trim(),
    city: values.city.trim(),
    cnpj: values.cnpj.trim(),
    complement: values.complement.trim(),
    coverageRanges: trimCoverageRanges(values),
    discoveryChannel: values.discoveryChannel.trim(),
    email: values.email.trim(),
    firstName: values.firstName.trim(),
    hasSoldPapelito: values.hasSoldPapelito.trim(),
    instagram: values.instagram.trim(),
    lastName: values.lastName.trim(),
    neighborhood: values.neighborhood.trim(),
    number: values.number.trim(),
    pagarmeDraft: buildPagarmeDraft(values),
    phoneNumber: values.phoneNumber.trim(),
    sourceUserId: values.sourceUserId,
    state: values.state.trim(),
    storeName: values.storeName.trim(),
    street: values.street.trim(),
    temporaryPassword: values.temporaryPassword,
  };
}

export function buildVendorRegistrationPayload(
  values: VendorFormValues,
): UpdateVendorPendingRegistrationInput {
  const coverageRanges = trimCoverageRanges(values);

  return {
    application: {
      coverageRanges,
      step1: normalizeStep1Data({
        cnpj: values.cnpj,
        discoveryChannel: values.discoveryChannel,
        email: values.email,
        firstName: values.firstName,
        hasSoldPapelito:
          values.hasSoldPapelito === "sim" || values.hasSoldPapelito === "nao"
            ? values.hasSoldPapelito
            : "",
        instagram: values.instagram,
        lastName: values.lastName,
        phone: values.phoneNumber,
        storeName: values.storeName,
      }),
      step2: normalizeStep2Data({
        cep: values.cep,
        city: values.city,
        complement: values.complement,
        maxCep: coverageRanges[0]?.maxCep ?? "",
        minCep: coverageRanges[0]?.minCep ?? "",
        neighborhood: values.neighborhood,
        number: values.number,
        state: values.state,
        street: values.street,
      }),
    },
    draft: normalizeStep3Data({ ...values.pagarmeDraft, bankAccount: values.bankAccount }),
  };
}

function resolveCoverageRanges(
  payload: VendorPendingRegistrationResponse,
  step2: ReturnType<typeof normalizeStep2Data>,
) {
  const stored = payload.application?.coverageRanges;

  if (stored?.length) {
    return stored.map((range) => ({
      maxCep: formatCep(range.maxCep ?? ""),
      minCep: formatCep(range.minCep ?? ""),
    }));
  }

  if (step2.coverageRanges.length > 0) {
    return step2.coverageRanges;
  }

  return step2.minCep || step2.maxCep
    ? [{ maxCep: step2.maxCep, minCep: step2.minCep }]
    : [{ maxCep: "", minCep: "" }];
}

function trimCoverageRanges(values: VendorFormValues) {
  return values.coverageRanges.map((range) => ({
    maxCep: range.maxCep.trim(),
    minCep: range.minCep.trim(),
  }));
}

function trimBankAccount(values: VendorFormValues) {
  return {
    ...values.bankAccount,
    accountCheckDigit: values.bankAccount.accountCheckDigit.trim(),
    branchCheckDigit: values.bankAccount.branchCheckDigit?.trim() ?? "",
    holderDocument: values.bankAccount.holderDocument.trim(),
    holderName: values.bankAccount.holderName.trim(),
  };
}

function buildPagarmeDraft(values: VendorFormValues): VendorRegistrationStep3Data {
  const partner =
    values.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
  const fallbackPartnerName = `${values.firstName} ${values.lastName}`.trim();

  return {
    ...values.pagarmeDraft,
    bankAccount: trimBankAccount(values),
    companyName: values.pagarmeDraft.companyName.trim(),
    managingPartners: [
      {
        ...partner,
        address: {
          ...partner.address,
          city: partner.address.city.trim() || values.city.trim(),
          complement: partner.address.complement.trim() || values.complement.trim(),
          neighborhood: partner.address.neighborhood.trim() || values.neighborhood.trim(),
          state: partner.address.state.trim() || values.state.trim(),
          street: partner.address.street.trim() || values.street.trim(),
          streetNumber: partner.address.streetNumber.trim() || values.number.trim(),
          zipCode: partner.address.zipCode.trim() || values.cep.trim(),
        },
        email: partner.email.trim() || values.email.trim(),
        name: partner.name.trim() || fallbackPartnerName,
      },
    ],
    tradingName: values.pagarmeDraft.tradingName.trim(),
  };
}
