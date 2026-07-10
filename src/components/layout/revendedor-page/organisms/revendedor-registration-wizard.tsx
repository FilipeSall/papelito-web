"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useCepLookup } from "@/features/checkout";
import { VendorCoverageRangesField } from "@/components/shared/vendor-coverage-ranges-field";
import {
  ADMIN_BANK_OPTIONS,
  bankHasBranchCheckDigit,
  findBankOptionByCode,
  OTHER_BANK_OPTION_VALUE,
} from "@/features/revendedor/constants/bank-codes";
import {
  REVENDEDOR_CORPORATION_TYPE_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
  useRevendedorRegistrationDraftStore,
} from "@/features/revendedor";
import type {
  RevendedorApplication,
  RevendedorStep1Errors,
  RevendedorStep2Errors,
  RevendedorStep3Errors,
  VendorRegistrationDraft,
} from "@/features/revendedor/types/revendedor-application";
import {
  buildRevendedorSubmitPayload,
  formatCpf,
  hasStep1Data,
  normalizeStep2Data,
  patchBankAccountField,
  patchManagingPartnerAddressField,
  patchManagingPartnerField,
  patchStep1Field,
  patchStep2Field,
  patchStep3Field,
  setManagingPartnerRepresentative,
  validateStep1,
  validateStep2,
  validateStep3,
} from "@/features/revendedor/utils/revendedor-registration";
import { RevendedorCtaButton } from "../atoms/revendedor-cta-button";
import { RevendedorApplicationPendingSummary } from "./revendedor-application-pending-summary";
import { RevendedorRegistrationStepper } from "./revendedor-registration-stepper";
import { RevendedorStep1Fields } from "./revendedor-step1-fields";
import { RevendedorFormField } from "../molecules/revendedor-form-field";
import { RevendedorFormRow } from "../molecules/revendedor-form-row";
import { RevendedorFormSelectField } from "../molecules/revendedor-form-select-field";
import { RevendedorFormLabel } from "../atoms/revendedor-form-label";

type RevendedorRegistrationWizardProps = {
  application: RevendedorApplication;
  editMode?: "pagarme" | null;
  initialDraft: VendorRegistrationDraft;
  isAuthenticated: boolean;
  returnTo?: string;
};

const HOLDER_TYPE_OPTIONS = [
  { label: "Pessoa jurídica", value: "company" },
  { label: "Pessoa física", value: "individual" },
] as const;

const ACCOUNT_TYPE_OPTIONS = [
  { label: "Conta corrente", value: "checking" },
  { label: "Conta poupança", value: "savings" },
] as const;

export function RevendedorRegistrationWizard({
  application,
  editMode,
  initialDraft,
  isAuthenticated,
  returnTo,
}: RevendedorRegistrationWizardProps) {
  const router = useRouter();
  const {
    draft,
    hasHydrated,
    mergeDraft,
    patchStep1,
    patchStep2,
    patchStep3,
    replaceDraft,
    resetDraft,
    setCurrentStep,
  } = useRevendedorRegistrationDraftStore((state) => state);
  const { isLoading: cepLoading, error: cepError, fetchCep } = useCepLookup();
  const bootstrappedRef = useRef(false);
  const formTopRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef<1 | 2 | 3 | null>(null);
  const [step1Errors, setStep1Errors] = useState<RevendedorStep1Errors>({});
  const [step2Errors, setStep2Errors] = useState<RevendedorStep2Errors>({});
  const [step3Errors, setStep3Errors] = useState<RevendedorStep3Errors>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitTone, setSubmitTone] = useState<"error" | "success">("error");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useCustomBankCode, setUseCustomBankCode] = useState(false);
  const isPagarmeEditMode =
    editMode === "pagarme" &&
    (application.status === "pending" ||
      application.status === "incomplete" ||
      application.status === "approved");
  const visibleStep: 1 | 2 | 3 = isPagarmeEditMode ? 3 : draft.currentStep;
  const editCallbackUrl = returnTo
    ? `/revendedor/cadastro?edit=pagarme&returnTo=${encodeURIComponent(returnTo)}`
    : "/revendedor/cadastro?edit=pagarme";

  useEffect(() => {
    if (!hasHydrated || bootstrappedRef.current) {
      return;
    }

    if (!isAuthenticated && draft.updatedAt) {
      mergeDraft(initialDraft);
    } else {
      replaceDraft(initialDraft);
    }
    bootstrappedRef.current = true;
  }, [draft.updatedAt, hasHydrated, initialDraft, isAuthenticated, mergeDraft, replaceDraft]);

  useEffect(() => {
    if (!hasHydrated || !bootstrappedRef.current) {
      return;
    }

    const hasEffectiveStep1Data =
      hasStep1Data(draft.step1) || hasStep1Data(initialDraft.step1);

    if (!hasEffectiveStep1Data) {
      router.replace("/revendedor");
    }
  }, [draft.step1, hasHydrated, initialDraft.step1, router]);

  useEffect(() => {
    if (!hasHydrated || !bootstrappedRef.current) {
      return;
    }

    const partner = draft.step3.managingPartners[0];
    const nextPatch: Partial<VendorRegistrationDraft["step3"]> = {};

    if (!draft.step3.companyName.trim() && draft.step1.storeName.trim()) {
      nextPatch.companyName = draft.step1.storeName;
    }
    if (!draft.step3.tradingName.trim() && draft.step1.storeName.trim()) {
      nextPatch.tradingName = draft.step1.storeName;
    }
    if (
      !draft.step3.bankAccount.holderName.trim() &&
      draft.step1.storeName.trim()
    ) {
      nextPatch.bankAccount = {
        ...draft.step3.bankAccount,
        holderName: draft.step1.storeName,
      };
    }
    if (
      !draft.step3.bankAccount.holderDocument.trim() &&
      draft.step1.cnpj.trim()
    ) {
      nextPatch.bankAccount = {
        ...(nextPatch.bankAccount ?? draft.step3.bankAccount),
        holderDocument: draft.step1.cnpj,
      };
    }
    const nextPartner = partner
      ? {
          ...partner,
          name:
            !partner.name.trim() && `${draft.step1.firstName} ${draft.step1.lastName}`.trim()
              ? `${draft.step1.firstName} ${draft.step1.lastName}`.trim()
              : partner.name,
          email:
            !partner.email.trim() && draft.step1.email.trim()
              ? draft.step1.email
              : partner.email,
          address: {
            ...partner.address,
            zipCode:
              !partner.address.zipCode.trim() && draft.step2.cep.trim()
                ? draft.step2.cep
                : partner.address.zipCode,
            street:
              !partner.address.street.trim() && draft.step2.street.trim()
                ? draft.step2.street
                : partner.address.street,
            streetNumber:
              !partner.address.streetNumber.trim() && draft.step2.number.trim()
                ? draft.step2.number
                : partner.address.streetNumber,
            complement:
              !partner.address.complement.trim() && draft.step2.complement.trim()
                ? draft.step2.complement
                : partner.address.complement,
            neighborhood:
              !partner.address.neighborhood.trim() && draft.step2.neighborhood.trim()
                ? draft.step2.neighborhood
                : partner.address.neighborhood,
            city:
              !partner.address.city.trim() && draft.step2.city.trim()
                ? draft.step2.city
                : partner.address.city,
            state:
              !partner.address.state.trim() && draft.step2.state.trim()
                ? draft.step2.state
                : partner.address.state,
          },
        }
      : null;

    if (
      partner &&
      nextPartner &&
      JSON.stringify(nextPartner) !== JSON.stringify(partner)
    ) {
      nextPatch.managingPartners = [
        nextPartner,
      ];
    }

    if (Object.keys(nextPatch).length > 0) {
      patchStep3(nextPatch);
    }
  }, [draft.step1, draft.step2, draft.step3, hasHydrated, patchStep3]);

  useEffect(() => {
    if (!hasHydrated || !bootstrappedRef.current) {
      previousStepRef.current = draft.currentStep;
      return;
    }

    if (previousStepRef.current !== null && previousStepRef.current !== draft.currentStep) {
      formTopRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }

    previousStepRef.current = draft.currentStep;
  }, [draft.currentStep, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || !bootstrappedRef.current || !isPagarmeEditMode) {
      return;
    }

    if (draft.currentStep !== 3) {
      setCurrentStep(3);
    }
  }, [draft.currentStep, hasHydrated, isPagarmeEditMode, setCurrentStep]);

  useEffect(() => {
    const bankCode = draft.step3.bankAccount.bankCode.trim();
    const selectedBankOption = findBankOptionByCode(bankCode);

    if (bankCode && !selectedBankOption) {
      setUseCustomBankCode(true);
    }
  }, [draft.step3.bankAccount.bankCode]);

  useEffect(() => {
    const bankCode = draft.step3.bankAccount.bankCode.trim();
    if (
      bankCode &&
      !bankHasBranchCheckDigit(bankCode) &&
      draft.step3.bankAccount.branchCheckDigit
    ) {
      handleBankAccountChange("branchCheckDigit", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.step3.bankAccount.bankCode]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen">
        <RevendedorWizardShowcase />
        <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-3xl">
            <p className="text-sm text-white/60">Carregando seu rascunho...</p>
          </div>
        </div>
      </div>
    );
  }

  if (
    (application.status === "pending" ||
      application.status === "incomplete" ||
      application.status === "approved") &&
    !isPagarmeEditMode
  ) {
    return (
      <div className="flex min-h-screen">
        <RevendedorWizardShowcase />
        <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-black uppercase tracking-wide text-white">
                Cadastro de revendedor
              </h1>
              <p className="mt-2 text-sm text-white/50">
                Sua candidatura já foi enviada. Acompanhe o status abaixo.
              </p>
            </div>

            <RevendedorApplicationPendingSummary application={application} />
          </div>
        </div>
      </div>
    );
  }

  const partner = draft.step3.managingPartners[0];
  const partnerSectionTitle =
    draft.step3.hasManagingPartner === "yes" ? "Sócio administrador" : "Responsável legal";
  const branchHasCheckDigit = bankHasBranchCheckDigit(
    draft.step3.bankAccount.bankCode.trim(),
  );
  const combinedAccountValue = formatBankFieldWithDigit(
    draft.step3.bankAccount.accountNumber,
    draft.step3.bankAccount.accountCheckDigit,
  );
  const selectedBankOption = findBankOptionByCode(draft.step3.bankAccount.bankCode.trim());
  const bankSelectValue = useCustomBankCode
    ? OTHER_BANK_OPTION_VALUE
    : (selectedBankOption?.value ?? "");

  function handleStep1Change<Key extends keyof VendorRegistrationDraft["step1"]>(
    key: Key,
    value: VendorRegistrationDraft["step1"][Key],
  ) {
    patchStep1({
      [key]: patchStep1Field(draft.step1, key, String(value))[key],
    });
    setStep1Errors((current) => ({ ...current, [key]: "" }));
    setSubmitMessage(null);
  }

  function handleStep2Change<Key extends keyof Omit<VendorRegistrationDraft["step2"], "coverageRanges">>(
    key: Key,
    value: VendorRegistrationDraft["step2"][Key],
  ) {
    patchStep2({
      [key]: patchStep2Field(draft.step2, key, String(value))[key],
    });
    setStep2Errors((current) => ({ ...current, [key]: "" }));
    setSubmitMessage(null);
  }

  function handleCoverageRangesChange(ranges: VendorRegistrationDraft["step2"]["coverageRanges"]) {
    const nextStep2 = normalizeStep2Data({
      ...draft.step2,
      coverageRanges: ranges,
    });

    patchStep2(nextStep2);
    setStep2Errors((current) => ({
      ...current,
      minCep: "",
      maxCep: "",
    }));
    setSubmitMessage(null);
  }

  async function handleStep2CepChange(rawValue: string) {
    const nextStep2 = patchStep2Field(draft.step2, "cep", rawValue);
    patchStep2({ cep: nextStep2.cep });
    setStep2Errors((current) => ({ ...current, cep: "" }));

    const digits = rawValue.replace(/\D/g, "");
    if (digits.length !== 8) {
      return;
    }

    const result = await fetchCep(digits);
    if (!result) {
      return;
    }

    patchStep2({
      street: result.street || draft.step2.street,
      neighborhood: result.neighborhood || draft.step2.neighborhood,
      city: result.city || draft.step2.city,
      state: result.state || draft.step2.state,
    });
  }

  function handleStep3Change<
    Key extends keyof Omit<VendorRegistrationDraft["step3"], "managingPartners" | "bankAccount" | "transfer">,
  >(key: Key, value: VendorRegistrationDraft["step3"][Key]) {
    patchStep3({
      [key]: patchStep3Field(draft.step3, key, String(value))[key],
    });
    setStep3Errors((current) => ({ ...current, [key]: undefined }));
    setSubmitMessage(null);
  }

  function handleCorporationTypeSelection(value: string) {
    patchStep3({
      corporationType: value === "outro" ? draft.step3.corporationTypeOther : value,
      corporationTypeOther: value === "outro" ? draft.step3.corporationTypeOther : "",
      corporationTypeSelection: value,
    });
    setStep3Errors((current) => ({ ...current, corporationType: undefined }));
    setSubmitMessage(null);
  }

  function handleCorporationTypeOtherChange(value: string) {
    patchStep3({
      corporationType: value,
      corporationTypeOther: value,
      corporationTypeSelection: "outro",
    });
    setStep3Errors((current) => ({ ...current, corporationType: undefined }));
    setSubmitMessage(null);
  }

  function handleBankAccountChange(
    key: keyof VendorRegistrationDraft["step3"]["bankAccount"],
    value: string,
  ) {
    patchStep3({
      bankAccount: patchBankAccountField(draft.step3, key, value).bankAccount,
    });
    setStep3Errors((current) => ({
      ...current,
      bankAccount: {
        ...current.bankAccount,
        [key]: undefined,
      },
    }));
  }

  function handleBranchNumberChange(rawValue: string) {
    const branchNumber = rawValue.replace(/\D/g, "").slice(0, 4);
    patchStep3({
      bankAccount: {
        ...draft.step3.bankAccount,
        branchNumber,
      },
    });
    setStep3Errors((current) => ({
      ...current,
      bankAccount: {
        ...current.bankAccount,
        branchNumber: undefined,
      },
    }));
  }

  function handleBranchCheckDigitChange(rawValue: string) {
    const branchCheckDigit = rawValue.replace(/[^0-9A-Za-z]/g, "").slice(0, 2);
    patchStep3({
      bankAccount: {
        ...draft.step3.bankAccount,
        branchCheckDigit,
      },
    });
    setStep3Errors((current) => ({
      ...current,
      bankAccount: {
        ...current.bankAccount,
        branchCheckDigit: undefined,
      },
    }));
  }

  function handleCombinedAccountChange(rawValue: string) {
    const sanitized = rawValue.replace(/[^0-9A-Za-z]/g, "");
    const accountNumber = sanitized.length > 1 ? sanitized.slice(0, -1) : sanitized;
    const accountCheckDigit = sanitized.length > 1 ? sanitized.slice(-1) : "";

    patchStep3({
      bankAccount: {
        ...draft.step3.bankAccount,
        accountNumber,
        accountCheckDigit,
      },
    });
    setStep3Errors((current) => ({
      ...current,
      bankAccount: {
        ...current.bankAccount,
        accountNumber: undefined,
        accountCheckDigit: undefined,
      },
    }));
  }

  function handleManagingPartnerChange(
    key: keyof Omit<
      NonNullable<VendorRegistrationDraft["step3"]["managingPartners"]>[number],
      "address" | "selfDeclaredLegalRepresentative"
    >,
    value: string,
  ) {
    patchStep3({
      managingPartners: patchManagingPartnerField(draft.step3, key, value).managingPartners,
    });
    setStep3Errors((current) => ({
      ...current,
      managingPartners: current.managingPartners?.map((entry, index) =>
        index === 0 ? { ...entry, [key]: undefined } : entry,
      ),
    }));
  }

  function handleManagingPartnerAddressChange(
    key: keyof NonNullable<
      NonNullable<VendorRegistrationDraft["step3"]["managingPartners"]>[number]["address"]
    >,
    value: string,
  ) {
    patchStep3({
      managingPartners: patchManagingPartnerAddressField(draft.step3, key, value).managingPartners,
    });
    setStep3Errors((current) => ({
      ...current,
      managingPartners: current.managingPartners?.map((entry, index) =>
        index === 0
          ? {
              ...entry,
              address: {
                ...entry.address,
                [key]: undefined,
              },
            }
          : entry,
      ),
    }));
  }

  function goToStep(step: 1 | 2 | 3) {
    if (step === 1) {
      setCurrentStep(1);
      return;
    }

    const nextStep1Errors = validateStep1(draft.step1);
    setStep1Errors(nextStep1Errors);
    if (Object.keys(nextStep1Errors).length > 0) {
      setCurrentStep(1);
      return;
    }

    if (step === 2) {
      setCurrentStep(2);
      return;
    }

    const nextStep2Errors = validateStep2(draft.step2);
    setStep2Errors(nextStep2Errors);
    if (Object.keys(nextStep2Errors).length > 0) {
      setCurrentStep(2);
      return;
    }

    setCurrentStep(3);
  }

  async function submit() {
    if (isPagarmeEditMode) {
      const nextStep3Errors = validateStep3(draft.step3);

      setStep3Errors(nextStep3Errors);
      setSubmitMessage(null);

      if (Object.keys(nextStep3Errors).length > 0) {
        setCurrentStep(3);
        return;
      }

      if (!isAuthenticated) {
        router.push(`/entrar?callbackUrl=${encodeURIComponent(editCallbackUrl)}`);
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/vendor/recipient-draft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildRevendedorSubmitPayload(draft).step3),
        });

        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;

        if (!response.ok) {
          setSubmitTone("error");
          setSubmitMessage(body?.message ?? "Nao foi possivel salvar os dados financeiros.");
          setIsSubmitting(false);
          return;
        }

        if (returnTo) {
          router.push(returnTo);
          router.refresh();
          return;
        }

        setSubmitTone("success");
        setSubmitMessage("Dados financeiros atualizados. Volte ao financeiro para sincronizar o recebedor.");
      } catch {
        setSubmitTone("error");
        setSubmitMessage("Erro de rede ao salvar os dados financeiros.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const nextStep1Errors = validateStep1(draft.step1);
    const nextStep2Errors = validateStep2(draft.step2);
    const nextStep3Errors = validateStep3(draft.step3);

    setStep1Errors(nextStep1Errors);
    setStep2Errors(nextStep2Errors);
    setStep3Errors(nextStep3Errors);
    setSubmitMessage(null);

    if (Object.keys(nextStep1Errors).length > 0) {
      setCurrentStep(1);
      return;
    }

    if (Object.keys(nextStep2Errors).length > 0) {
      setCurrentStep(2);
      return;
    }

    if (Object.keys(nextStep3Errors).length > 0) {
      setCurrentStep(3);
      return;
    }

    if (!isAuthenticated) {
      router.push("/entrar?callbackUrl=%2Frevendedor%2Fcadastro");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/revendedor/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildRevendedorSubmitPayload(draft)),
      });

      const body = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setSubmitTone("error");
        setSubmitMessage(body?.message ?? "Não foi possível enviar sua candidatura agora.");
        setIsSubmitting(false);
        return;
      }

      resetDraft();
      router.push("/revendedor");
      router.refresh();
    } catch {
      setSubmitTone("error");
      setSubmitMessage("Erro de rede ao enviar a candidatura.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <RevendedorWizardShowcase />

      <div className="flex w-full items-center justify-center bg-brand-dark px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-3xl">
          <div ref={formTopRef} className="scroll-mt-28" />

          {!isPagarmeEditMode ? (
            <div className="mb-8 flex items-center gap-2">
              <RevendedorRegistrationStepper
                currentStep={visibleStep}
                onStepChange={goToStep}
              />
              <span className="ml-2 text-xs text-white/40">
                Etapa {visibleStep} de 3
              </span>
            </div>
          ) : null}

          <h1 className="text-3xl font-black uppercase tracking-wide text-white">
            {isPagarmeEditMode
              ? "Dados financeiros"
              : visibleStep === 1
              ? "Dados Iniciais"
              : visibleStep === 2
                ? "Localização"
                : "Gateway de Pagamento"}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {isPagarmeEditMode
              ? "Atualize os dados de KYC e a conta bancária usados para sincronizar seu recebedor na Pagar.me."
              : visibleStep === 1
              ? "Revise ou edite a triagem inicial antes de seguir."
              : visibleStep === 2
                ? "Cadastre o endereço base da operação e a faixa de CEP atendida."
                : "Preencha os dados bancários e de KYC necessários para o onboarding do recebedor Pagar.me."}
          </p>

          <div className="mt-10">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-[-0.32px] text-white">
                {isPagarmeEditMode
                  ? "Dados bancários e KYC"
                  : visibleStep === 1
                  ? "Step 1: Dados iniciais"
                  : visibleStep === 2
                    ? "Step 2: Localização"
                    : "Step 3: Dados bancários e KYC"}
              </h2>
              <p className="text-sm leading-6 text-white/45">
                {isPagarmeEditMode
                  ? "Salve as alterações e depois volte ao financeiro para sincronizar o recebedor."
                  : "Os dados ficam salvos neste navegador até o envio final."}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-6">
            {visibleStep === 1 ? (
              <div className="flex flex-col gap-4">
                <RevendedorStep1Fields
                  errors={step1Errors}
                  onChange={handleStep1Change}
                  tone="dark"
                  values={draft.step1}
                />
              </div>
            ) : null}

            {visibleStep === 2 ? (
              <div className="flex flex-col gap-4">
                <RevendedorFormField
                  autoComplete="postal-code"
                  error={step2Errors.cep || cepError || undefined}
                  id="cep"
                  inputMode="numeric"
                  label="CEP de operação *"
                  maxLength={9}
                  name="cep"
                  onChange={(event) => void handleStep2CepChange(event.target.value)}
                  placeholder="00000-000"
                  tone="dark"
                  value={draft.step2.cep}
                />

                {cepLoading ? (
                  <p className="text-sm text-white/45">Buscando endereço pelo CEP...</p>
                ) : null}

                <RevendedorFormField
                  error={step2Errors.street}
                  id="street"
                  label="Rua / Logradouro *"
                  name="street"
                  onChange={(event) => handleStep2Change("street", event.target.value)}
                  placeholder="Rua, avenida ou travessa"
                  tone="dark"
                  value={draft.step2.street}
                />

                <RevendedorFormRow>
                  <RevendedorFormField
                    error={step2Errors.number}
                    id="number"
                    label="Número *"
                    name="number"
                    onChange={(event) =>
                      handleStep2Change("number", event.target.value.replace(/[^\dA-Za-z-]/g, ""))
                    }
                    placeholder="Ex: 123"
                    tone="dark"
                    value={draft.step2.number}
                  />
                  <RevendedorFormField
                    error={step2Errors.complement}
                    id="complement"
                    label="Complemento"
                    name="complement"
                    onChange={(event) => handleStep2Change("complement", event.target.value)}
                    placeholder="Sala, bloco, galpão..."
                    tone="dark"
                    value={draft.step2.complement}
                  />
                </RevendedorFormRow>

                <RevendedorFormRow>
                  <RevendedorFormField
                    error={step2Errors.neighborhood}
                    id="neighborhood"
                    label="Bairro *"
                    name="neighborhood"
                    onChange={(event) => handleStep2Change("neighborhood", event.target.value)}
                    placeholder="Nome do bairro"
                    tone="dark"
                    value={draft.step2.neighborhood}
                  />
                  <RevendedorFormField
                    error={step2Errors.city}
                    id="city"
                    label="Cidade *"
                    name="city"
                    onChange={(event) => handleStep2Change("city", event.target.value)}
                    placeholder="Cidade"
                    tone="dark"
                    value={draft.step2.city}
                  />
                </RevendedorFormRow>

                <RevendedorFormSelectField
                  error={step2Errors.state}
                  label="Estado *"
                  onChange={(value) => handleStep2Change("state", value)}
                  options={REVENDEDOR_STATE_OPTIONS}
                  tone="dark"
                  value={draft.step2.state}
                />

                <VendorCoverageRangesField
                  maxError={step2Errors.maxCep}
                  minError={step2Errors.minCep}
                  mode="single"
                  onChangeRanges={handleCoverageRangesChange}
                  ranges={draft.step2.coverageRanges}
                  required
                  variant="revendedor-dark"
                />
              </div>
            ) : null}

            {visibleStep === 3 ? (
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Empresa
                  </p>

                  <div className="mt-4 flex flex-col gap-4">
                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.companyName}
                        id="companyName"
                        label="Razão social *"
                        name="companyName"
                        onChange={(event) => handleStep3Change("companyName", event.target.value)}
                        placeholder="Razão social"
                        tone="dark"
                        value={draft.step3.companyName}
                      />
                      <RevendedorFormField
                        error={step3Errors.tradingName}
                        id="tradingName"
                        label="Nome fantasia *"
                        name="tradingName"
                        onChange={(event) => handleStep3Change("tradingName", event.target.value)}
                        placeholder="Nome fantasia"
                        tone="dark"
                        value={draft.step3.tradingName}
                      />
                    </RevendedorFormRow>

                    <RevendedorFormRow>
                      <RevendedorFormSelectField
                        error={step3Errors.corporationType}
                        label="Natureza jurídica *"
                        onChange={handleCorporationTypeSelection}
                        options={REVENDEDOR_CORPORATION_TYPE_OPTIONS}
                        placeholder="Selecione a natureza jurídica"
                        tone="dark"
                        value={draft.step3.corporationTypeSelection}
                      />
                      <RevendedorFormField
                        error={step3Errors.foundingDate}
                        id="foundingDate"
                        label="Data de fundação *"
                        name="foundingDate"
                        onChange={(event) => handleStep3Change("foundingDate", event.target.value)}
                        placeholder="AAAA-MM-DD"
                        tone="dark"
                        type="date"
                        value={draft.step3.foundingDate}
                      />
                    </RevendedorFormRow>

                    {draft.step3.corporationTypeSelection === "outro" ? (
                      <RevendedorFormField
                        error={step3Errors.corporationType}
                        id="corporationTypeOther"
                        label="Qual é a natureza jurídica? *"
                        name="corporationTypeOther"
                        onChange={(event) => handleCorporationTypeOtherChange(event.target.value)}
                        placeholder="Descreva a natureza jurídica"
                        tone="dark"
                        value={draft.step3.corporationTypeOther}
                      />
                    ) : null}

                    <RevendedorFormField
                      error={step3Errors.annualRevenue}
                      id="annualRevenue"
                      label="Faturamento anual *"
                      name="annualRevenue"
                      onChange={(event) => handleStep3Change("annualRevenue", event.target.value)}
                      placeholder="0.00"
                      tone="dark"
                      type="number"
                      value={draft.step3.annualRevenue}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Pessoa responsável pelo recebedor
                  </p>

                  <div className="mt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <RevendedorFormLabel htmlFor="hasManagingPartner" tone="dark">
                        Tem sócio administrador?
                      </RevendedorFormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex h-12 cursor-pointer items-center justify-center rounded-3.5 border-2 ${
                            draft.step3.hasManagingPartner === "yes"
                              ? "border-brand-yellow bg-brand-yellow text-brand-dark"
                              : "border-white/20 bg-white/10 text-white/70"
                          }`}
                        >
                          <input
                            checked={draft.step3.hasManagingPartner === "yes"}
                            className="sr-only"
                            name="hasManagingPartner"
                            onChange={() => patchStep3({ hasManagingPartner: "yes" })}
                            type="radio"
                          />
                          <span className="text-sm font-black uppercase">Sim</span>
                        </label>
                        <label
                          className={`flex h-12 cursor-pointer items-center justify-center rounded-3.5 border-2 ${
                            draft.step3.hasManagingPartner === "no"
                              ? "border-brand-yellow bg-brand-yellow text-brand-dark"
                              : "border-white/20 bg-white/10 text-white/70"
                          }`}
                        >
                          <input
                            checked={draft.step3.hasManagingPartner === "no"}
                            className="sr-only"
                            name="hasManagingPartner"
                            onChange={() => patchStep3({ hasManagingPartner: "no" })}
                            type="radio"
                          />
                          <span className="text-sm font-black uppercase">Não</span>
                        </label>
                      </div>
                    </div>

                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                      {partnerSectionTitle}
                    </p>

                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.managingPartners?.[0]?.name}
                        id="partnerName"
                        label="Nome completo *"
                        name="partnerName"
                        onChange={(event) => handleManagingPartnerChange("name", event.target.value)}
                        placeholder={
                          draft.step3.hasManagingPartner === "yes"
                            ? "Nome do sócio"
                            : "Nome do responsável legal"
                        }
                        tone="dark"
                        value={partner?.name ?? ""}
                      />
                      <RevendedorFormField
                        error={step3Errors.managingPartners?.[0]?.email}
                        id="partnerEmail"
                        label="E-mail *"
                        name="partnerEmail"
                        onChange={(event) => handleManagingPartnerChange("email", event.target.value)}
                        placeholder={
                          draft.step3.hasManagingPartner === "yes"
                            ? "socio@email.com"
                            : "responsavel@email.com"
                        }
                        tone="dark"
                        type="email"
                        value={partner?.email ?? ""}
                      />
                    </RevendedorFormRow>

                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.managingPartners?.[0]?.document}
                        id="partnerDocument"
                        label="CPF *"
                        name="partnerDocument"
                        onChange={(event) =>
                          handleManagingPartnerChange("document", formatCpf(event.target.value))
                        }
                        placeholder="000.000.000-00"
                        tone="dark"
                        value={partner?.document ?? ""}
                      />
                      <RevendedorFormField
                        error={step3Errors.managingPartners?.[0]?.motherName}
                        id="partnerMotherName"
                        label="Nome da mãe *"
                        name="partnerMotherName"
                        onChange={(event) =>
                          handleManagingPartnerChange("motherName", event.target.value)
                        }
                        placeholder="Nome da mãe"
                        tone="dark"
                        value={partner?.motherName ?? ""}
                      />
                    </RevendedorFormRow>

                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.managingPartners?.[0]?.birthdate}
                        id="partnerBirthdate"
                        label="Data de nascimento *"
                        name="partnerBirthdate"
                        onChange={(event) =>
                          handleManagingPartnerChange("birthdate", event.target.value)
                        }
                        placeholder="AAAA-MM-DD"
                        tone="dark"
                        type="date"
                        value={partner?.birthdate ?? ""}
                      />
                      <RevendedorFormField
                        error={step3Errors.managingPartners?.[0]?.monthlyIncome}
                        id="partnerMonthlyIncome"
                        label="Renda mensal *"
                        name="partnerMonthlyIncome"
                        onChange={(event) =>
                          handleManagingPartnerChange("monthlyIncome", event.target.value)
                        }
                        placeholder="0.00"
                        tone="dark"
                        type="number"
                        value={partner?.monthlyIncome ?? ""}
                      />
                    </RevendedorFormRow>

                    <RevendedorFormField
                      error={step3Errors.managingPartners?.[0]?.professionalOccupation}
                      id="partnerOccupation"
                      label="Ocupação profissional *"
                      name="partnerOccupation"
                      onChange={(event) =>
                        handleManagingPartnerChange("professionalOccupation", event.target.value)
                      }
                      placeholder={
                        draft.step3.hasManagingPartner === "yes"
                          ? "Ex: Sócio administrador"
                          : "Ex: Proprietário"
                      }
                      tone="dark"
                      value={partner?.professionalOccupation ?? ""}
                    />

                    <div className="flex flex-col gap-2">
                      <RevendedorFormLabel
                        htmlFor="selfDeclaredLegalRepresentative"
                        tone="dark"
                      >
                        Representante legal autodeclarado
                      </RevendedorFormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex h-12 cursor-pointer items-center justify-center rounded-3.5 border-2 ${
                            partner?.selfDeclaredLegalRepresentative
                              ? "border-brand-yellow bg-brand-yellow text-brand-dark"
                              : "border-white/20 bg-white/10 text-white/70"
                          }`}
                        >
                          <input
                            checked={Boolean(partner?.selfDeclaredLegalRepresentative)}
                            className="sr-only"
                            name="selfDeclaredLegalRepresentative"
                            onChange={() =>
                              patchStep3({
                                managingPartners: setManagingPartnerRepresentative(
                                  draft.step3,
                                  true,
                                ).managingPartners,
                              })
                            }
                            type="radio"
                          />
                          <span className="text-sm font-black uppercase">Sim</span>
                        </label>
                        <label
                          className={`flex h-12 cursor-pointer items-center justify-center rounded-3.5 border-2 ${
                            partner?.selfDeclaredLegalRepresentative === false
                              ? "border-brand-yellow bg-brand-yellow text-brand-dark"
                              : "border-white/20 bg-white/10 text-white/70"
                          }`}
                        >
                          <input
                            checked={partner?.selfDeclaredLegalRepresentative === false}
                            className="sr-only"
                            name="selfDeclaredLegalRepresentative"
                            onChange={() =>
                              patchStep3({
                                managingPartners: setManagingPartnerRepresentative(
                                  draft.step3,
                                  false,
                                ).managingPartners,
                              })
                            }
                            type="radio"
                          />
                          <span className="text-sm font-black uppercase">Não</span>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-brand-dark/40 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                        {draft.step3.hasManagingPartner === "yes"
                          ? "Endereço do sócio"
                          : "Endereço do responsável legal"}
                      </p>

                      <div className="mt-4 flex flex-col gap-4">
                        <RevendedorFormField
                          error={step3Errors.managingPartners?.[0]?.address?.zipCode}
                          id="partnerZipCode"
                          inputMode="numeric"
                          label="CEP *"
                          maxLength={9}
                          name="partnerZipCode"
                          onChange={(event) =>
                            handleManagingPartnerAddressChange("zipCode", event.target.value)
                          }
                          placeholder="00000-000"
                          tone="dark"
                          value={partner?.address.zipCode ?? ""}
                        />

                        <RevendedorFormField
                          error={step3Errors.managingPartners?.[0]?.address?.street}
                          id="partnerStreet"
                          label="Rua / Logradouro *"
                          name="partnerStreet"
                          onChange={(event) =>
                            handleManagingPartnerAddressChange("street", event.target.value)
                          }
                          placeholder="Rua, avenida ou travessa"
                          tone="dark"
                          value={partner?.address.street ?? ""}
                        />

                        <RevendedorFormRow>
                          <RevendedorFormField
                            error={step3Errors.managingPartners?.[0]?.address?.streetNumber}
                            id="partnerStreetNumber"
                            label="Número *"
                            name="partnerStreetNumber"
                            onChange={(event) =>
                              handleManagingPartnerAddressChange(
                                "streetNumber",
                                event.target.value.replace(/[^\dA-Za-z-]/g, ""),
                              )
                            }
                            placeholder="Ex: 123"
                            tone="dark"
                            value={partner?.address.streetNumber ?? ""}
                          />
                          <RevendedorFormField
                            error={step3Errors.managingPartners?.[0]?.address?.complement}
                            id="partnerComplement"
                            label="Complemento"
                            name="partnerComplement"
                            onChange={(event) =>
                              handleManagingPartnerAddressChange("complement", event.target.value)
                            }
                            placeholder="Apto, bloco, sala..."
                            tone="dark"
                            value={partner?.address.complement ?? ""}
                          />
                        </RevendedorFormRow>

                        <RevendedorFormRow>
                          <RevendedorFormField
                            error={step3Errors.managingPartners?.[0]?.address?.neighborhood}
                            id="partnerNeighborhood"
                            label="Bairro *"
                            name="partnerNeighborhood"
                            onChange={(event) =>
                              handleManagingPartnerAddressChange("neighborhood", event.target.value)
                            }
                            placeholder="Nome do bairro"
                            tone="dark"
                            value={partner?.address.neighborhood ?? ""}
                          />
                          <RevendedorFormField
                            error={step3Errors.managingPartners?.[0]?.address?.city}
                            id="partnerCity"
                            label="Cidade *"
                            name="partnerCity"
                            onChange={(event) =>
                              handleManagingPartnerAddressChange("city", event.target.value)
                            }
                            placeholder="Cidade"
                            tone="dark"
                            value={partner?.address.city ?? ""}
                          />
                        </RevendedorFormRow>

                        <RevendedorFormSelectField
                          error={step3Errors.managingPartners?.[0]?.address?.state}
                          label="Estado *"
                          onChange={(value) =>
                            handleManagingPartnerAddressChange("state", value)
                          }
                          options={REVENDEDOR_STATE_OPTIONS}
                          tone="dark"
                          value={partner?.address.state ?? ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
                    Conta bancária
                  </p>

                  <div className="mt-4 flex flex-col gap-4">
                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.bankAccount?.holderName}
                        id="holderName"
                        label="Titular da conta *"
                        name="holderName"
                        onChange={(event) =>
                          handleBankAccountChange("holderName", event.target.value)
                        }
                        placeholder="Nome do titular"
                        tone="dark"
                        value={draft.step3.bankAccount.holderName}
                      />
                      <RevendedorFormSelectField
                        error={step3Errors.bankAccount?.holderType}
                        label="Tipo do titular *"
                        onChange={(value) => handleBankAccountChange("holderType", value)}
                        options={HOLDER_TYPE_OPTIONS}
                        tone="dark"
                        value={draft.step3.bankAccount.holderType}
                      />
                    </RevendedorFormRow>

                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.bankAccount?.holderDocument}
                        id="holderDocument"
                        label="Documento do titular *"
                        name="holderDocument"
                        onChange={(event) =>
                          handleBankAccountChange(
                            "holderDocument",
                            draft.step3.bankAccount.holderType === "company"
                              ? event.target.value
                              : formatCpf(event.target.value),
                          )
                        }
                        placeholder={
                          draft.step3.bankAccount.holderType === "company"
                            ? "00.000.000/0001-00"
                            : "000.000.000-00"
                        }
                        tone="dark"
                        value={draft.step3.bankAccount.holderDocument}
                      />
                      <RevendedorFormSelectField
                        error={step3Errors.bankAccount?.bankCode}
                        label="Banco *"
                        onChange={(value) => {
                          if (value === OTHER_BANK_OPTION_VALUE) {
                            setUseCustomBankCode(true);
                            handleBankAccountChange("bankCode", "");
                            return;
                          }

                          setUseCustomBankCode(false);
                          handleBankAccountChange("bankCode", value);
                        }}
                        options={ADMIN_BANK_OPTIONS}
                        placeholder="Selecione"
                        tone="dark"
                        value={bankSelectValue}
                      />
                    </RevendedorFormRow>

                    {useCustomBankCode ? (
                      <RevendedorFormRow>
                        <RevendedorFormField
                          error={step3Errors.bankAccount?.bankCode}
                          id="bankCode"
                          inputMode="numeric"
                          label="Código do banco *"
                          maxLength={3}
                          name="bankCode"
                          onChange={(event) =>
                            handleBankAccountChange("bankCode", event.target.value)
                          }
                          placeholder="000"
                          tone="dark"
                          value={draft.step3.bankAccount.bankCode}
                        />
                      </RevendedorFormRow>
                    ) : null}

                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={step3Errors.bankAccount?.branchNumber}
                        id="branchNumber"
                        inputMode="numeric"
                        label="Agência *"
                        maxLength={8}
                        name="branchNumber"
                        onChange={(event) => handleBranchNumberChange(event.target.value)}
                        placeholder="0001"
                        tone="dark"
                        value={draft.step3.bankAccount.branchNumber}
                      />
                      <RevendedorFormField
                        disabled={!branchHasCheckDigit}
                        error={step3Errors.bankAccount?.branchCheckDigit}
                        id="branchCheckDigit"
                        inputMode="numeric"
                        label={
                          branchHasCheckDigit
                            ? "Dígito da agência"
                            : "Dígito da agência (este banco não usa)"
                        }
                        maxLength={2}
                        name="branchCheckDigit"
                        onChange={(event) =>
                          handleBranchCheckDigitChange(event.target.value)
                        }
                        placeholder={branchHasCheckDigit ? "9" : "—"}
                        tone="dark"
                        value={
                          branchHasCheckDigit
                            ? draft.step3.bankAccount.branchCheckDigit
                            : ""
                        }
                      />
                    </RevendedorFormRow>

                    <RevendedorFormRow>
                      <RevendedorFormField
                        error={
                          step3Errors.bankAccount?.accountNumber ||
                          step3Errors.bankAccount?.accountCheckDigit
                        }
                        id="accountCombined"
                        inputMode="numeric"
                        label="Conta com dígito *"
                        maxLength={20}
                        name="accountCombined"
                        onChange={(event) => handleCombinedAccountChange(event.target.value)}
                        placeholder="123456-7"
                        tone="dark"
                        value={combinedAccountValue}
                      />
                    </RevendedorFormRow>

                    <RevendedorFormSelectField
                      error={step3Errors.bankAccount?.type}
                      label="Tipo de conta *"
                      onChange={(value) => handleBankAccountChange("type", value)}
                      options={ACCOUNT_TYPE_OPTIONS}
                      tone="dark"
                      value={draft.step3.bankAccount.type}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {submitMessage ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  submitTone === "success"
                    ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                    : "border border-red-400/40 bg-red-500/10 text-red-200"
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-white/45">
                {isPagarmeEditMode
                  ? "Essas alterações não reenviam sua triagem. Elas apenas atualizam o draft financeiro do recebedor."
                  : "O rascunho só é limpo após o envio final com sucesso."}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                {!isPagarmeEditMode && draft.currentStep > 1 ? (
                  <RevendedorCtaButton
                    onClick={() => setCurrentStep((draft.currentStep - 1) as 1 | 2 | 3)}
                    type="button"
                    variant="outline"
                  >
                    Voltar
                  </RevendedorCtaButton>
                ) : null}

                {isPagarmeEditMode ? (
                  <>
                    {returnTo ? (
                      <RevendedorCtaButton
                        onClick={() => router.push(returnTo)}
                        type="button"
                        variant="outline"
                      >
                        Voltar ao financeiro
                      </RevendedorCtaButton>
                    ) : null}
                    <RevendedorCtaButton disabled={isSubmitting} onClick={() => void submit()} type="button">
                      {isSubmitting ? "Salvando..." : "Salvar dados financeiros"}
                    </RevendedorCtaButton>
                  </>
                ) : draft.currentStep < 3 ? (
                  <RevendedorCtaButton
                    onClick={() => goToStep((draft.currentStep + 1) as 1 | 2 | 3)}
                    type="button"
                  >
                    Próximo passo
                  </RevendedorCtaButton>
                ) : (
                  <RevendedorCtaButton disabled={isSubmitting} onClick={() => void submit()} type="button">
                    {isSubmitting ? "Enviando..." : "Enviar"}
                  </RevendedorCtaButton>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const benefits = [
  "Triagem em etapas com rascunho salvo",
  "Configuração de cobertura por CEP",
  "Coleta dos dados necessários para análise",
];

function RevendedorWizardShowcase() {
  return (
    <div className="relative hidden items-center justify-center bg-brand-yellow lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-1/2">
      <div className="flex flex-col items-center px-12 text-center">
        <Image
          src="/images/auth/logo-with-flag.svg"
          alt="Marketplace Papelito"
          width={304}
          height={182}
          className="mb-8"
          priority
        />
        <h2 className="text-2xl font-semibold tracking-tight text-brand-dark">
          SEJA NOSSO REVENDEDOR
        </h2>
        <p className="mt-2 text-lg leading-7 text-brand-dark/70">
          Continue seu cadastro no programa PDV Perfeito
        </p>

        <ul className="mt-10 space-y-3">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark">
                <WizardCheckIcon className="h-3 w-3 text-brand-yellow" />
              </span>
              <span className="text-sm font-medium text-brand-dark">
                {benefit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatBankFieldWithDigit(value: string, digit: string) {
  const sanitizedValue = value.replace(/[^0-9A-Za-z]/g, "");
  const sanitizedDigit = digit.replace(/[^0-9A-Za-z]/g, "").slice(0, 1);

  if (!sanitizedValue) {
    return sanitizedDigit;
  }

  return sanitizedDigit ? `${sanitizedValue}-${sanitizedDigit}` : sanitizedValue;
}

function WizardCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 6L5 9L10 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
