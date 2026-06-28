import type { ProfileCustomer } from "@/features/profile/types/profile-customer";
import {
  getLegacyCoverageRange,
  normalizeCoverageRange,
  normalizeCoverageRanges,
} from "@/features/vendor-coverage/coverage-presets";
import type {
  RevendedorApplication,
  RevendedorStep1Errors,
  RevendedorStep2Errors,
  RevendedorStep3Errors,
  SubmitRevendedorApplicationInput,
  VendorApplicationResponse,
  VendorBankAccount,
  VendorManagingPartner,
  VendorRegistrationAddress,
  VendorRegistrationDraft,
  VendorRegistrationStep1Data,
  VendorRegistrationStep2Data,
  VendorRegistrationStep3Data,
} from "../types/revendedor-application";
import { isVendorPendingFieldKey } from "../constants/pending-registration";
import {
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCep,
  isValidCnpj,
  isValidEmail,
  normalizeCep,
  sanitizeInstagramHandle,
} from "./revendedor-formatters";

export const REVENDEDOR_REGISTRATION_STORAGE_KEY = "papelito:revendedor:cadastro-draft";

export function createEmptyVendorRegistrationAddress(): VendorRegistrationAddress {
  return {
    zipCode: "",
    street: "",
    streetNumber: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  };
}

export function createEmptyVendorManagingPartner(): VendorManagingPartner {
  return {
    name: "",
    email: "",
    document: "",
    motherName: "",
    birthdate: "",
    monthlyIncome: "",
    professionalOccupation: "",
    selfDeclaredLegalRepresentative: true,
    address: createEmptyVendorRegistrationAddress(),
  };
}

export function createEmptyVendorBankAccount(): VendorBankAccount {
  return {
    holderName: "",
    holderType: "company",
    holderDocument: "",
    bankCode: "",
    branchNumber: "",
    branchCheckDigit: "",
    accountNumber: "",
    accountCheckDigit: "",
    type: "checking",
  };
}

export function createEmptyStep1Data(): VendorRegistrationStep1Data {
  return {
    storeName: "",
    firstName: "",
    lastName: "",
    cnpj: "",
    phone: "",
    email: "",
    instagram: "",
    hasSoldPapelito: "",
    discoveryChannel: "",
  };
}

export function createEmptyStep2Data(): VendorRegistrationStep2Data {
  return {
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    minCep: "",
    maxCep: "",
    coverageRanges: [],
  };
}

export function createEmptyStep3Data(): VendorRegistrationStep3Data {
  return {
    companyName: "",
    tradingName: "",
    corporationType: "",
    corporationTypeOther: "",
    corporationTypeSelection: "",
    foundingDate: "",
    annualRevenue: "",
    hasManagingPartner: "yes",
    managingPartners: [createEmptyVendorManagingPartner()],
    bankAccount: createEmptyVendorBankAccount(),
    transfer: {
      interval: "Daily",
      day: 0,
    },
  };
}

export function createEmptyVendorRegistrationDraft(
  currentStep: 1 | 2 | 3 = 1,
): VendorRegistrationDraft {
  return {
    version: 1,
    currentStep,
    step1: createEmptyStep1Data(),
    step2: createEmptyStep2Data(),
    step3: createEmptyStep3Data(),
    updatedAt: "",
  };
}

export function createEmptyRevendedorApplication(): RevendedorApplication {
  return {
    pendingFields: [],
    status: "none",
    submittedAt: "",
    step1: createEmptyStep1Data(),
    step2: createEmptyStep2Data(),
    pagarmeDraft: null,
  };
}

export function normalizeRevendedorApplication(
  payload?: VendorApplicationResponse | null,
): RevendedorApplication {
  if (!payload) {
    return createEmptyRevendedorApplication();
  }

  const pendingFields = Array.isArray(payload.pendingFields)
    ? payload.pendingFields
        .map(normalizePendingField)
        .filter((field): field is NonNullable<ReturnType<typeof normalizePendingField>> => field !== null)
    : [];

  return {
    pendingFields,
    status:
      payload.status === "pending" ||
      payload.status === "incomplete" ||
      payload.status === "approved" ||
      payload.status === "rejected"
        ? payload.status
        : "none",
    submittedAt: payload.submittedAt ?? "",
    step1: normalizeStep1Data(payload.application?.step1),
    step2: normalizeStep2Data(payload.application?.step2),
    pagarmeDraft: payload.pagarmeDraft
      ? normalizeStep3Data(payload.pagarmeDraft)
      : null,
  };
}

function normalizePendingField(value: unknown) {
  return typeof value === "string" && isVendorPendingFieldKey(value) ? value : null;
}

export function buildDraftFromSources(
  customer?: ProfileCustomer | null,
  application?: RevendedorApplication | null,
): VendorRegistrationDraft {
  const draft = createEmptyVendorRegistrationDraft(application?.status === "none" ? 2 : 1);

  if (customer) {
    draft.step1 = {
      ...draft.step1,
      storeName: customer.meta.storeName || customer.billing.company,
      firstName: customer.firstName || customer.billing.firstName,
      lastName: customer.lastName || customer.billing.lastName,
      cnpj: customer.meta.cnpj,
      phone: customer.meta.phoneNumber || customer.billing.phone,
      email: customer.email || customer.billing.email,
      instagram: customer.meta.instagram,
    };

    draft.step2 = {
      ...draft.step2,
      cep: customer.meta.cep || customer.shipping.postcode || customer.billing.postcode,
      city: customer.meta.city || customer.shipping.city || customer.billing.city,
      state: customer.meta.state || customer.shipping.state || customer.billing.state,
    };
  }

  if (application && application.status !== "none") {
    draft.step1 = {
      ...draft.step1,
      ...application.step1,
    };
    draft.step2 = {
      ...draft.step2,
      ...application.step2,
    };
    draft.step3 = application.pagarmeDraft
      ? normalizeStep3Data(application.pagarmeDraft)
      : draft.step3;
  }

  draft.step3.companyName = draft.step3.companyName || draft.step1.storeName;
  draft.step3.tradingName = draft.step3.tradingName || draft.step1.storeName;

  if (!draft.step3.bankAccount.holderDocument) {
    draft.step3.bankAccount.holderDocument = draft.step1.cnpj;
  }

  if (!draft.step3.bankAccount.holderName) {
    draft.step3.bankAccount.holderName = draft.step1.storeName;
  }

  const partner = draft.step3.managingPartners[0] ?? createEmptyVendorManagingPartner();
  draft.step3.managingPartners = [
    {
      ...partner,
      name: partner.name || `${draft.step1.firstName} ${draft.step1.lastName}`.trim(),
      email: partner.email || draft.step1.email,
      address: {
        ...createEmptyVendorRegistrationAddress(),
        ...partner.address,
        zipCode: partner.address.zipCode || draft.step2.cep,
        street: partner.address.street || draft.step2.street,
        streetNumber: partner.address.streetNumber || draft.step2.number,
        complement: partner.address.complement || draft.step2.complement,
        neighborhood: partner.address.neighborhood || draft.step2.neighborhood,
        city: partner.address.city || draft.step2.city,
        state: partner.address.state || draft.step2.state,
      },
    },
  ];

  return normalizeDraft(draft);
}

export function normalizeDraft(value?: Partial<VendorRegistrationDraft> | null): VendorRegistrationDraft {
  const base = createEmptyVendorRegistrationDraft(
    value?.currentStep === 2 || value?.currentStep === 3 ? value.currentStep : 1,
  );

  return {
    version: 1,
    currentStep: value?.currentStep === 2 || value?.currentStep === 3 ? value.currentStep : base.currentStep,
    step1: normalizeStep1Data(value?.step1),
    step2: normalizeStep2Data(value?.step2),
    step3: normalizeStep3Data(value?.step3),
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : "",
  };
}

export function mergeVendorDraft(
  current: VendorRegistrationDraft,
  incoming: Partial<VendorRegistrationDraft>,
): VendorRegistrationDraft {
  const next = normalizeDraft(incoming);

  return {
    ...current,
    currentStep: current.currentStep,
    step1: mergeStringRecord(current.step1, next.step1),
    step2: {
      ...mergeStringRecord(current.step2, next.step2),
      coverageRanges:
        current.step2.coverageRanges.length > 0
          ? current.step2.coverageRanges
          : next.step2.coverageRanges,
    },
    step3: {
      ...current.step3,
      companyName: current.step3.companyName || next.step3.companyName,
      tradingName: current.step3.tradingName || next.step3.tradingName,
      corporationType: current.step3.corporationType || next.step3.corporationType,
      corporationTypeOther: current.step3.corporationTypeOther || next.step3.corporationTypeOther,
      corporationTypeSelection:
        current.step3.corporationTypeSelection || next.step3.corporationTypeSelection,
      foundingDate: current.step3.foundingDate || next.step3.foundingDate,
      annualRevenue: current.step3.annualRevenue || next.step3.annualRevenue,
      hasManagingPartner: current.step3.hasManagingPartner || next.step3.hasManagingPartner,
      bankAccount: mergeStringRecord(current.step3.bankAccount, next.step3.bankAccount),
      transfer: current.step3.transfer,
      managingPartners: mergeManagingPartners(
        current.step3.managingPartners,
        next.step3.managingPartners,
      ),
    },
    updatedAt: current.updatedAt || next.updatedAt,
  };
}

export function normalizeStep1Data(value?: Partial<VendorRegistrationStep1Data> | null): VendorRegistrationStep1Data {
  const base = createEmptyStep1Data();

  return {
    storeName: sanitizeText(value?.storeName) || base.storeName,
    firstName: sanitizeText(value?.firstName) || base.firstName,
    lastName: sanitizeText(value?.lastName) || base.lastName,
    cnpj: formatCnpj(sanitizeText(value?.cnpj)),
    phone: formatPhone(sanitizeText(value?.phone)),
    email: sanitizeText(value?.email),
    instagram: sanitizeInstagramHandle(sanitizeText(value?.instagram)),
    hasSoldPapelito:
      value?.hasSoldPapelito === "sim" || value?.hasSoldPapelito === "nao"
        ? value.hasSoldPapelito
        : "",
    discoveryChannel: sanitizeText(value?.discoveryChannel),
  };
}

export function normalizeStep2Data(value?: Partial<VendorRegistrationStep2Data> | null): VendorRegistrationStep2Data {
  const base = createEmptyStep2Data();
  const normalizedCoverageRanges = normalizeCoverageRanges(value?.coverageRanges).filter(
    (range) => range.minCep || range.maxCep,
  );
  const legacyRange = normalizeCoverageRange({
    minCep: value?.minCep,
    maxCep: value?.maxCep,
  });
  const coverageRanges =
    normalizedCoverageRanges.length > 0
      ? normalizedCoverageRanges
      : legacyRange.minCep || legacyRange.maxCep
        ? [legacyRange]
        : base.coverageRanges;
  const primaryRange = getLegacyCoverageRange(coverageRanges);

  return {
    cep: formatCep(sanitizeText(value?.cep)),
    street: sanitizeText(value?.street) || base.street,
    number: sanitizeText(value?.number) || base.number,
    complement: sanitizeText(value?.complement) || base.complement,
    neighborhood: sanitizeText(value?.neighborhood) || base.neighborhood,
    city: sanitizeText(value?.city) || base.city,
    state: sanitizeText(value?.state).toUpperCase(),
    minCep: primaryRange.minCep,
    maxCep: primaryRange.maxCep,
    coverageRanges,
  };
}

export function normalizeStep3Data(value?: Partial<VendorRegistrationStep3Data> | null): VendorRegistrationStep3Data {
  const base = createEmptyStep3Data();
  const managingPartners = Array.isArray(value?.managingPartners) && value.managingPartners.length > 0
    ? value.managingPartners.map(normalizeManagingPartner)
    : base.managingPartners;
  const rawCorporationType = sanitizeText(value?.corporationType);
  const corporationTypeSelection = deriveCorporationTypeSelection(
    sanitizeText(value?.corporationTypeSelection),
    rawCorporationType,
  );
  const corporationTypeOther =
    corporationTypeSelection === "outro"
      ? sanitizeText(value?.corporationTypeOther) || rawCorporationType
      : "";
  const corporationType =
    corporationTypeSelection === "outro"
      ? corporationTypeOther
      : corporationTypeSelection || rawCorporationType;

  return {
    companyName: sanitizeText(value?.companyName),
    tradingName: sanitizeText(value?.tradingName),
    corporationType,
    corporationTypeOther,
    corporationTypeSelection,
    foundingDate: sanitizeDate(value?.foundingDate),
    annualRevenue: sanitizeMoney(value?.annualRevenue),
    hasManagingPartner: value?.hasManagingPartner === "no" ? "no" : base.hasManagingPartner,
    managingPartners,
    bankAccount: normalizeBankAccount(value?.bankAccount),
    transfer: base.transfer,
  };
}

export function patchStep1Field(
  current: VendorRegistrationStep1Data,
  key: keyof VendorRegistrationStep1Data,
  rawValue: string,
): VendorRegistrationStep1Data {
  return normalizeStep1Data({
    ...current,
    [key]: rawValue,
  });
}

export function patchStep2Field(
  current: VendorRegistrationStep2Data,
  key: keyof Omit<VendorRegistrationStep2Data, "coverageRanges">,
  rawValue: string,
): VendorRegistrationStep2Data {
  return normalizeStep2Data({
    ...current,
    [key]: rawValue,
  });
}

export function patchStep3Field(
  current: VendorRegistrationStep3Data,
  key: keyof Omit<VendorRegistrationStep3Data, "managingPartners" | "bankAccount" | "transfer">,
  rawValue: string,
): VendorRegistrationStep3Data {
  return normalizeStep3Data({
    ...current,
    [key]: rawValue,
  });
}

export function patchManagingPartnerField(
  current: VendorRegistrationStep3Data,
  key: keyof Omit<VendorManagingPartner, "address" | "selfDeclaredLegalRepresentative">,
  rawValue: string,
): VendorRegistrationStep3Data {
  const partner = current.managingPartners[0] ?? createEmptyVendorManagingPartner();

  return normalizeStep3Data({
    ...current,
    managingPartners: [
      {
        ...partner,
        [key]: rawValue,
      },
    ],
  });
}

export function patchManagingPartnerAddressField(
  current: VendorRegistrationStep3Data,
  key: keyof VendorRegistrationAddress,
  rawValue: string,
): VendorRegistrationStep3Data {
  const partner = current.managingPartners[0] ?? createEmptyVendorManagingPartner();

  return normalizeStep3Data({
    ...current,
    managingPartners: [
      {
        ...partner,
        address: {
          ...partner.address,
          [key]: rawValue,
        },
      },
    ],
  });
}

export function setManagingPartnerRepresentative(
  current: VendorRegistrationStep3Data,
  value: boolean,
): VendorRegistrationStep3Data {
  const partner = current.managingPartners[0] ?? createEmptyVendorManagingPartner();

  return normalizeStep3Data({
    ...current,
    managingPartners: [
      {
        ...partner,
        selfDeclaredLegalRepresentative: value,
      },
    ],
  });
}

export function patchBankAccountField(
  current: VendorRegistrationStep3Data,
  key: keyof VendorBankAccount,
  rawValue: string,
): VendorRegistrationStep3Data {
  return normalizeStep3Data({
    ...current,
    bankAccount: {
      ...current.bankAccount,
      [key]: rawValue,
    },
  });
}

export function validateStep1(values: VendorRegistrationStep1Data): RevendedorStep1Errors {
  const errors: RevendedorStep1Errors = {};

  if (!values.storeName.trim()) errors.storeName = "Informe o nome da loja.";
  if (!values.firstName.trim()) errors.firstName = "Informe o nome do responsável.";
  if (!values.lastName.trim()) errors.lastName = "Informe o sobrenome.";
  if (!isValidCnpj(values.cnpj)) errors.cnpj = "Informe um CNPJ válido.";
  if (values.phone.replace(/\D/g, "").length < 10) errors.phone = "Informe um telefone com DDD.";
  if (!isValidEmail(values.email)) errors.email = "Informe um e-mail válido.";
  if (!values.instagram.trim()) errors.instagram = "Informe o Instagram da loja.";
  if (!values.hasSoldPapelito) {
    errors.hasSoldPapelito = "Escolha se você já vende produtos Papelito.";
  }

  return errors;
}

export function validateStep2(values: VendorRegistrationStep2Data): RevendedorStep2Errors {
  const errors: RevendedorStep2Errors = {};
  const primaryCoverageRange =
    values.coverageRanges.length > 0
      ? getLegacyCoverageRange(values.coverageRanges)
      : normalizeCoverageRange({
          minCep: values.minCep,
          maxCep: values.maxCep,
        });

  if (!isValidCep(values.cep)) errors.cep = "Informe um CEP de operação válido.";
  if (!values.street.trim()) errors.street = "Informe o logradouro.";
  if (!values.number.trim()) errors.number = "Informe o número.";
  if (!values.neighborhood.trim()) errors.neighborhood = "Informe o bairro.";
  if (!values.city.trim()) errors.city = "Informe a cidade.";
  if (!values.state.trim()) errors.state = "Selecione o estado.";
  if (!isValidCep(primaryCoverageRange.minCep)) errors.minCep = "Informe um CEP inicial válido.";
  if (!isValidCep(primaryCoverageRange.maxCep)) errors.maxCep = "Informe um CEP final válido.";

  if (
    !errors.minCep &&
    !errors.maxCep &&
    Number(normalizeCep(primaryCoverageRange.minCep)) >
      Number(normalizeCep(primaryCoverageRange.maxCep))
  ) {
    errors.maxCep = "O CEP final precisa ser maior ou igual ao CEP inicial.";
  }

  return errors;
}

export function validateStep3(values: VendorRegistrationStep3Data): RevendedorStep3Errors {
  const errors: RevendedorStep3Errors = {};

  if (!values.companyName.trim()) errors.companyName = "Informe a razão social.";
  if (!values.tradingName.trim()) errors.tradingName = "Informe o nome fantasia.";
  if (!values.corporationType.trim()) errors.corporationType = "Informe a natureza jurídica.";
  if (!isValidIsoDate(values.foundingDate)) errors.foundingDate = "Informe uma data válida.";
  if (!isPositiveNumber(values.annualRevenue)) {
    errors.annualRevenue = "Informe o faturamento anual.";
  }

  const partnerErrors = values.managingPartners.map((partner) => {
    const currentErrors: NonNullable<RevendedorStep3Errors["managingPartners"]>[number] = {};

    if (!partner.name.trim()) currentErrors.name = "Informe o nome do sócio.";
    if (!isValidEmail(partner.email)) currentErrors.email = "Informe um e-mail válido.";
    if (!isValidCpf(partner.document)) currentErrors.document = "Informe um CPF válido.";
    if (!partner.motherName.trim()) currentErrors.motherName = "Informe o nome da mãe.";
    if (!isValidIsoDate(partner.birthdate)) currentErrors.birthdate = "Informe uma data válida.";
    if (!isPositiveNumber(partner.monthlyIncome)) {
      currentErrors.monthlyIncome = "Informe a renda mensal.";
    }
    if (!partner.professionalOccupation.trim()) {
      currentErrors.professionalOccupation = "Informe a ocupação profissional.";
    }

    const addressErrors: NonNullable<typeof currentErrors.address> = {};

    if (!isValidCep(partner.address.zipCode)) addressErrors.zipCode = "Informe um CEP válido.";
    if (!partner.address.street.trim()) addressErrors.street = "Informe o logradouro.";
    if (!partner.address.streetNumber.trim()) addressErrors.streetNumber = "Informe o número.";
    if (!partner.address.neighborhood.trim()) addressErrors.neighborhood = "Informe o bairro.";
    if (!partner.address.city.trim()) addressErrors.city = "Informe a cidade.";
    if (!partner.address.state.trim()) addressErrors.state = "Selecione o estado.";

    if (Object.keys(addressErrors).length > 0) {
      currentErrors.address = addressErrors;
    }

    return currentErrors;
  });

  if (partnerErrors.some((entry) => Object.keys(entry).length > 0)) {
    errors.managingPartners = partnerErrors;
  }

  const bankAccountErrors: NonNullable<RevendedorStep3Errors["bankAccount"]> = {};

  if (!values.bankAccount.holderName.trim()) {
    bankAccountErrors.holderName = "Informe o titular da conta.";
  }
  if (
    values.bankAccount.holderType === "company"
      ? !isValidCnpj(values.bankAccount.holderDocument)
      : !isValidCpf(values.bankAccount.holderDocument)
  ) {
    bankAccountErrors.holderDocument = "Informe um documento válido.";
  }
  if (!/^\d{3}$/.test(values.bankAccount.bankCode.trim())) {
    bankAccountErrors.bankCode = "Informe o código do banco com 3 dígitos.";
  }
  if (!/^\d+$/.test(values.bankAccount.branchNumber.trim())) {
    bankAccountErrors.branchNumber = "Informe uma agência válida.";
  }
  if (!/^\d+$/.test(values.bankAccount.accountNumber.trim())) {
    bankAccountErrors.accountNumber = "Informe uma conta válida.";
  }
  if (!/^[0-9A-Za-z]+$/.test(values.bankAccount.accountCheckDigit.trim())) {
    bankAccountErrors.accountCheckDigit = "Informe o dígito da conta.";
  }

  if (Object.keys(bankAccountErrors).length > 0) {
    errors.bankAccount = bankAccountErrors;
  }

  return errors;
}

export function hasStep1Data(values: VendorRegistrationStep1Data): boolean {
  return Boolean(
    values.storeName.trim() ||
      values.firstName.trim() ||
      values.lastName.trim() ||
      values.cnpj.trim() ||
      values.phone.trim() ||
      values.email.trim() ||
      values.instagram.trim() ||
      values.discoveryChannel.trim() ||
      values.hasSoldPapelito,
  );
}

export function isStep1Ready(values: VendorRegistrationStep1Data): boolean {
  return Object.keys(validateStep1(values)).length === 0;
}

export function buildRevendedorSubmitPayload(
  draft: VendorRegistrationDraft,
): SubmitRevendedorApplicationInput {
  const normalizedStep3 = normalizeStep3Data(draft.step3);

  return {
    step1: normalizeStep1Data(draft.step1),
    step2: normalizeStep2Data(draft.step2),
    step3: {
      companyName: normalizedStep3.companyName,
      tradingName: normalizedStep3.tradingName,
      corporationType: normalizedStep3.corporationType,
      foundingDate: normalizedStep3.foundingDate,
      annualRevenue: normalizedStep3.annualRevenue,
      managingPartners: normalizedStep3.managingPartners,
      bankAccount: normalizedStep3.bankAccount,
      transfer: normalizedStep3.transfer,
    },
  };
}

export function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const base = digits.slice(0, 9);
  const firstDigit = calculateCpfDigit(base, 10);
  const secondDigit = calculateCpfDigit(`${base}${firstDigit}`, 11);

  return digits.endsWith(`${firstDigit}${secondDigit}`);
}

function calculateCpfDigit(value: string, startWeight: number) {
  const total = value
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * (startWeight - index), 0);
  const remainder = (total * 10) % 11;

  return remainder === 10 ? 0 : remainder;
}

function normalizeManagingPartner(value?: Partial<VendorManagingPartner> | null): VendorManagingPartner {
  const base = createEmptyVendorManagingPartner();

  return {
    name: sanitizeText(value?.name),
    email: sanitizeText(value?.email),
    document: formatCpf(sanitizeText(value?.document)),
    motherName: sanitizeText(value?.motherName),
    birthdate: sanitizeDate(value?.birthdate),
    monthlyIncome: sanitizeMoney(value?.monthlyIncome),
    professionalOccupation: sanitizeText(value?.professionalOccupation),
    selfDeclaredLegalRepresentative: value?.selfDeclaredLegalRepresentative ?? base.selfDeclaredLegalRepresentative,
    address: normalizeAddress(value?.address),
  };
}

function normalizeAddress(value?: Partial<VendorRegistrationAddress> | null): VendorRegistrationAddress {
  return {
    zipCode: formatCep(sanitizeText(value?.zipCode)),
    street: sanitizeText(value?.street),
    streetNumber: sanitizeText(value?.streetNumber),
    complement: sanitizeText(value?.complement),
    neighborhood: sanitizeText(value?.neighborhood),
    city: sanitizeText(value?.city),
    state: sanitizeText(value?.state).toUpperCase(),
  };
}

function normalizeBankAccount(value?: Partial<VendorBankAccount> | null): VendorBankAccount {
  const base = createEmptyVendorBankAccount();
  const holderType = value?.holderType === "individual" ? "individual" : "company";

  return {
    holderName: sanitizeText(value?.holderName),
    holderType,
    holderDocument:
      holderType === "company"
        ? formatCnpj(sanitizeText(value?.holderDocument))
        : formatCpf(sanitizeText(value?.holderDocument)),
    bankCode: sanitizeDigits(value?.bankCode, 3),
    branchNumber: sanitizeDigits(value?.branchNumber),
    branchCheckDigit: sanitizeAlphaNumeric(value?.branchCheckDigit),
    accountNumber: sanitizeDigits(value?.accountNumber),
    accountCheckDigit: sanitizeAlphaNumeric(value?.accountCheckDigit),
    type: value?.type === "savings" ? "savings" : base.type,
  };
}

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trimStart() : "";
}

function sanitizeDigits(value: unknown, limit?: number) {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return typeof limit === "number" ? digits.slice(0, limit) : digits;
}

function sanitizeAlphaNumeric(value: unknown) {
  return typeof value === "string" ? value.replace(/[^0-9A-Za-z]/g, "") : "";
}

function sanitizeMoney(value: unknown) {
  return typeof value === "string" ? value.replace(",", ".").replace(/[^\d.]/g, "") : "";
}

function sanitizeDate(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function isPositiveNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function deriveCorporationTypeSelection(selection: string, corporationType: string) {
  if (selection === "outro") {
    return selection;
  }

  if (CORPORATION_TYPE_VALUES.has(selection)) {
    return selection;
  }

  if (CORPORATION_TYPE_VALUES.has(corporationType)) {
    return corporationType;
  }

  return corporationType ? "outro" : "";
}

function isValidIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function mergeStringRecord<T extends Record<string, unknown>>(current: T, incoming: T): T {
  const next = { ...current } as Record<string, unknown>;

  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === "string") {
      if (!String(current[key] ?? "").trim()) {
        next[key] = value;
      }
      continue;
    }

    if ((current[key] === null || current[key] === undefined) && value !== undefined) {
      next[key] = value;
    }
  }

  return next as T;
}

const CORPORATION_TYPE_VALUES = new Set([
  "Sociedade Empresária Limitada",
  "Sociedade Limitada Unipessoal",
  "Empresário Individual",
  "MEI",
  "Sociedade Anônima",
  "EIRELI",
]);

function mergeManagingPartners(
  current: VendorManagingPartner[],
  incoming: VendorManagingPartner[],
) {
  const currentPartner = current[0] ?? createEmptyVendorManagingPartner();
  const incomingPartner = incoming[0] ?? createEmptyVendorManagingPartner();

  return [
    {
      ...currentPartner,
      ...mergeStringRecord(currentPartner, incomingPartner),
      address: mergeStringRecord(currentPartner.address, incomingPartner.address),
    },
  ];
}
