import type { VendorRegistrationStep3Data } from "@/features/revendedor/types/revendedor-application";
import {
  isValidCep,
  isValidCnpj,
  isValidEmail,
} from "@/features/revendedor/utils/revendedor-formatters";
import {
  createEmptyStep3Data,
  isValidCpf,
} from "@/features/revendedor/utils/revendedor-registration";
import { validateCoverageRanges } from "@/features/vendor-coverage/coverage-presets";
import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";

import type { VendorCreateForm, VendorCreateSourceUser } from "./types";

export function createInitialVendorCreateForm(): VendorCreateForm {
  return {
    sourceUserId: undefined,
    email: "",
    temporaryPassword: "",
    storeName: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    cnpj: "",
    instagram: "",
    state: "",
    city: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    discoveryChannel: "",
    hasSoldPapelito: "",
    coverageRanges: [{ minCep: "", maxCep: "" }],
    bankAccount: {
      holderName: "",
      holderType: "company",
      holderDocument: "",
      bankCode: "",
      branchNumber: "",
      branchCheckDigit: "",
      accountNumber: "",
      accountCheckDigit: "",
      type: "checking",
    },
    pagarmeDraft: createEmptyStep3Data(),
  };
}

export function createVendorCreateFormFromSourceUser(
  sourceUser?: VendorCreateSourceUser | null,
): VendorCreateForm {
  const form = createInitialVendorCreateForm();
  if (!sourceUser) return form;

  const fullName = `${sourceUser.firstName} ${sourceUser.lastName}`.trim() || sourceUser.name.trim();
  const storeName = sourceUser.storeName.trim() || fullName;
  const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];

  return {
    ...form,
    sourceUserId: sourceUser.id,
    email: sourceUser.email.trim(),
    storeName,
    firstName: sourceUser.firstName.trim(),
    lastName: sourceUser.lastName.trim(),
    phoneNumber: sourceUser.phoneNumber.trim(),
    cnpj: sourceUser.cnpj.trim(),
    instagram: sourceUser.instagram.trim(),
    state: sourceUser.state.trim(),
    city: sourceUser.city.trim(),
    cep: sourceUser.cep.trim(),
    street: sourceUser.street.trim(),
    number: sourceUser.number.trim(),
    complement: sourceUser.complement.trim(),
    neighborhood: sourceUser.neighborhood.trim(),
    bankAccount: { ...form.bankAccount, holderDocument: sourceUser.cnpj.trim(), holderName: storeName || fullName },
    pagarmeDraft: {
      ...form.pagarmeDraft,
      managingPartners: [{
        ...partner,
        email: sourceUser.email.trim(),
        name: fullName,
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
      }],
    },
  };
}

export function digits(value: string, max?: number) {
  const clean = value.replace(/\D/g, "");
  return typeof max === "number" ? clean.slice(0, max) : clean;
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

export function validateVendorCreateForm(form: VendorCreateForm): string | null {
  if (!isValidEmail(form.email)) return "Informe um e-mail válido.";
  if (!form.sourceUserId && !form.temporaryPassword.trim()) return "Informe uma senha temporária para o vendor.";
  if (!form.storeName?.trim()) return "Informe o nome da loja.";
  if (!isValidCnpj(form.cnpj)) return "Informe um CNPJ válido.";
  if (!isValidCep(form.cep ?? "")) return "Informe um CEP válido para a loja.";
  if (!form.street?.trim()) return "Informe o logradouro da loja.";
  if (!form.number?.trim()) return "Informe o número da loja.";
  if (!form.neighborhood?.trim()) return "Informe o bairro da loja.";
  if (!form.city?.trim()) return "Informe a cidade da loja.";
  if (!form.state?.trim()) return "Informe o estado da loja.";
  return validateCoverageRanges(form.coverageRanges);
}

function buildAdminPagarmeDraft(form: VendorCreateForm): VendorRegistrationStep3Data {
  const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
  const fallbackPartnerName = `${form.firstName ?? ""} ${form.lastName ?? ""}`.trim();
  return {
    ...form.pagarmeDraft,
    companyName: form.pagarmeDraft.companyName.trim(),
    tradingName: form.pagarmeDraft.tradingName.trim(),
    bankAccount: { ...form.bankAccount, branchCheckDigit: form.bankAccount.branchCheckDigit ?? "" },
    managingPartners: [{
      ...partner,
      name: partner.name.trim() || fallbackPartnerName,
      email: partner.email.trim() || form.email.trim(),
      address: {
        ...partner.address,
        zipCode: partner.address.zipCode.trim() || form.cep?.trim() || "",
        street: partner.address.street.trim() || form.street?.trim() || "",
        streetNumber: partner.address.streetNumber.trim() || form.number?.trim() || "",
        complement: partner.address.complement.trim() || form.complement?.trim() || "",
        neighborhood: partner.address.neighborhood.trim() || form.neighborhood?.trim() || "",
        city: partner.address.city.trim() || form.city?.trim() || "",
        state: partner.address.state.trim() || form.state?.trim() || "",
      },
    }],
  };
}

export function buildVendorCreatePayload(form: VendorCreateForm): AdminVendorCreatePayload {
  return {
    ...form,
    sourceUserId: form.sourceUserId,
    email: form.email.trim(),
    temporaryPassword: form.temporaryPassword,
    storeName: form.storeName?.trim(),
    firstName: form.firstName?.trim(),
    lastName: form.lastName?.trim(),
    phoneNumber: form.phoneNumber?.trim(),
    cnpj: form.cnpj.trim(),
    instagram: form.instagram?.trim(),
    state: form.state?.trim(),
    city: form.city?.trim(),
    cep: form.cep?.trim(),
    street: form.street?.trim(),
    number: form.number?.trim(),
    complement: form.complement?.trim(),
    neighborhood: form.neighborhood?.trim(),
    hasSoldPapelito: form.hasSoldPapelito?.trim(),
    coverageRanges: form.coverageRanges.map((range) => ({ minCep: range.minCep.trim(), maxCep: range.maxCep.trim() })),
    bankAccount: {
      ...form.bankAccount,
      holderName: form.bankAccount.holderName.trim(),
      holderDocument: form.bankAccount.holderDocument.trim(),
      branchCheckDigit: form.bankAccount.branchCheckDigit?.trim() ?? "",
      accountCheckDigit: form.bankAccount.accountCheckDigit.trim(),
    },
    pagarmeDraft: buildAdminPagarmeDraft(form),
  };
}
