"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { VendorCoverageRangesField } from "@/components/shared/vendor-coverage-ranges-field";
import {
  ADMIN_BANK_OPTIONS,
  OTHER_BANK_OPTION_VALUE,
  bankHasBranchCheckDigit,
  findBankOptionByCode,
} from "@/features/revendedor/constants/bank-codes";
import {
  REVENDEDOR_CORPORATION_TYPE_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
} from "@/features/revendedor/constants/revendedor-content";
import {
  VENDOR_PENDING_FIELD_LABELS,
  isVendorPendingFieldKey,
  type VendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";
import type {
  UpdateVendorPendingRegistrationInput,
  VendorCoverageRange,
  VendorPendingRegistrationResponse,
  VendorRegistrationStep3Data,
} from "@/features/revendedor/types/revendedor-application";
import {
  createEmptyStep1Data,
  createEmptyStep2Data,
  createEmptyStep3Data,
  formatCpf,
  normalizeStep1Data,
  normalizeStep2Data,
  normalizeStep3Data,
  patchBankAccountField,
  patchManagingPartnerAddressField,
  patchManagingPartnerField,
  patchStep3Field,
} from "@/features/revendedor/utils/revendedor-registration";
import {
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCep,
  isValidCnpj,
  isValidEmail,
} from "@/features/revendedor/utils/revendedor-formatters";
import { validateCoverageRanges } from "@/features/vendor-coverage/coverage-presets";
import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import { useAuthSession } from "@/hooks/use-auth-session";
import { AdminSelectField } from "@/components/layout/admin-panel/sections/products/components/admin-select-field";
import { InfoTooltip } from "@/components/layout/admin-panel/sections/products/components/form-fields";

type PendingForm = {
  email: string;
  storeName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  cnpj: string;
  instagram: string;
  state: string;
  city: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  discoveryChannel: string;
  hasSoldPapelito: string;
  coverageRanges: VendorCoverageRange[];
  bankAccount: VendorRegistrationStep3Data["bankAccount"];
  pagarmeDraft: VendorRegistrationStep3Data;
};

type PendingState = {
  form: PendingForm;
  pendingFields: VendorPendingFieldKey[];
};

type VendorPendingRegistrationModalHostProps = {
  dismissible?: boolean;
  mode?: "modal" | "page";
  returnTo?: string;
};

function digits(value: string, max?: number) {
  const clean = value.replace(/\D/g, "");
  return typeof max === "number" ? clean.slice(0, max) : clean;
}

function fieldClass(hasError = false, disabled = false) {
  return [
    "mt-2 h-11 w-full rounded-none border-2 px-3 text-sm outline-none transition",
    "focus:ring-0",
    disabled
      ? "cursor-not-allowed border-dashed border-[#1a1a1a]/25 bg-[#1a1a1a]/5 text-[#1a1a1a]/40 placeholder:text-[#1a1a1a]/30"
      : "bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#1a1a1a]",
    disabled ? "" : hasError ? "border-[#c0392b]" : "border-[#1a1a1a]",
  ].join(" ");
}

function Field({
  autoComplete,
  disabled = false,
  error,
  helpText,
  helperText,
  inputMode,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  helperText?: string;
  inputMode?: "decimal" | "email" | "numeric" | "tel" | "text";
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        {helpText ? <InfoTooltip text={helpText} /> : null}
      </span>
      <input
        autoComplete={autoComplete}
        className={fieldClass(Boolean(error), disabled)}
        disabled={disabled}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-[11px] font-semibold text-[#c0392b]">{error}</span> : null}
      {!error && helperText ? (
        <span className="mt-1 block text-[11px] text-[#1a1a1a]/50">{helperText}</span>
      ) : null}
    </label>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="border-t-2 border-[#1a1a1a]/10 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function createFormFromResponse(payload: VendorPendingRegistrationResponse): PendingForm {
  const step1 = normalizeStep1Data(payload.application?.step1 ?? createEmptyStep1Data());
  const step2 = normalizeStep2Data(payload.application?.step2 ?? createEmptyStep2Data());
  const pagarmeDraft = normalizeStep3Data(payload.draft ?? createEmptyStep3Data());
  const coverageRanges =
    payload.application?.coverageRanges?.length
      ? payload.application.coverageRanges.map((range) => ({
          minCep: formatCep(range.minCep ?? ""),
          maxCep: formatCep(range.maxCep ?? ""),
        }))
      : step2.minCep || step2.maxCep
        ? [{ minCep: step2.minCep, maxCep: step2.maxCep }]
        : [{ minCep: "", maxCep: "" }];

  return {
    email: step1.email,
    storeName: step1.storeName,
    firstName: step1.firstName,
    lastName: step1.lastName,
    phoneNumber: step1.phone,
    cnpj: step1.cnpj,
    instagram: step1.instagram,
    state: step2.state,
    city: step2.city,
    cep: step2.cep,
    street: step2.street,
    number: step2.number,
    complement: step2.complement,
    neighborhood: step2.neighborhood,
    discoveryChannel: step1.discoveryChannel,
    hasSoldPapelito: step1.hasSoldPapelito,
    coverageRanges,
    bankAccount: pagarmeDraft.bankAccount,
    pagarmeDraft,
  };
}

function validateForm(form: PendingForm): string | null {
  if (!isValidEmail(form.email)) return "Informe um e-mail valido.";
  if (!form.storeName.trim()) return "Informe o nome da loja.";
  if (!isValidCnpj(form.cnpj)) return "Informe um CNPJ valido.";
  if (!isValidCep(form.cep)) return "Informe um CEP valido para a loja.";
  if (!form.street.trim()) return "Informe o logradouro da loja.";
  if (!form.number.trim()) return "Informe o numero da loja.";
  if (!form.neighborhood.trim()) return "Informe o bairro da loja.";
  if (!form.city.trim()) return "Informe a cidade da loja.";
  if (!form.state.trim()) return "Informe o estado da loja.";

  const coverageError = validateCoverageRanges(form.coverageRanges);
  if (coverageError) return coverageError;

  return null;
}

function toPendingFieldKeyList(value: unknown): VendorPendingFieldKey[] {
  return Array.isArray(value)
    ? value.filter(
        (field): field is VendorPendingFieldKey =>
          typeof field === "string" && isVendorPendingFieldKey(field),
      )
    : [];
}

function buildPayload(form: PendingForm): UpdateVendorPendingRegistrationInput {
  const coverageRanges = form.coverageRanges.map((range) => ({
    minCep: range.minCep.trim(),
    maxCep: range.maxCep.trim(),
  }));

  const normalizedStep3 = normalizeStep3Data({
    ...form.pagarmeDraft,
    bankAccount: form.bankAccount,
  });

  return {
    application: {
      step1: normalizeStep1Data({
        storeName: form.storeName,
        firstName: form.firstName,
        lastName: form.lastName,
        cnpj: form.cnpj,
        phone: form.phoneNumber,
        email: form.email,
        instagram: form.instagram,
        hasSoldPapelito:
          form.hasSoldPapelito === "sim" || form.hasSoldPapelito === "nao"
            ? form.hasSoldPapelito
            : "",
        discoveryChannel: form.discoveryChannel,
      }),
      step2: normalizeStep2Data({
        cep: form.cep,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        minCep: coverageRanges[0]?.minCep ?? "",
        maxCep: coverageRanges[0]?.maxCep ?? "",
      }),
      coverageRanges,
    },
    draft: normalizedStep3,
  };
}

export function VendorPendingRegistrationModalHost({
  dismissible = true,
  mode = "modal",
  returnTo,
}: VendorPendingRegistrationModalHostProps = {}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isSessionLoading, isSeller, session } = useAuthSession();
  const [state, setState] = useState<PendingState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [formError, setFormError] = useState<string | null>(null);
  const [useCustomBankCode, setUseCustomBankCode] = useState(false);
  const [cepStatus, setCepStatus] = useState<{
    tone: "error" | "info";
    message: string;
  } | null>(null);
  const [isCepLookingUp, setIsCepLookingUp] = useState(false);
  const cepLookupRequestIdRef = useRef(0);
  const isPageMode = mode === "page";

  useEffect(() => {
    setDismissed(false);
    setMessage(null);
    setFormError(null);
  }, [session?.accessToken]);

  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!isAuthenticated || !isSeller) {
      setState(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const response = await fetch("/api/vendor/registration-pending", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          if (!cancelled) {
            setState(null);
          }
          return;
        }

        const payload = (await response.json()) as VendorPendingRegistrationResponse;
        const pendingFields = toPendingFieldKeyList(payload.pendingFields);

        if (cancelled) {
          return;
        }

        const form = createFormFromResponse(payload);
        const bankCode = form.bankAccount.bankCode.trim();

        setUseCustomBankCode(Boolean(bankCode) && !findBankOptionByCode(bankCode));
        setState(
          isPageMode || pendingFields.length > 0
            ? { form, pendingFields }
            : null,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPageMode, isSeller, isSessionLoading, session?.accessToken]);

  useEffect(() => {
    if (!state) {
      return;
    }

    const currentBankCode = state.form.bankAccount.bankCode.trim();
    if (
      bankHasBranchCheckDigit(currentBankCode) ||
      !state.form.bankAccount.branchCheckDigit
    ) {
      return;
    }

    setState((current) =>
      current
        ? {
            ...current,
            form: {
              ...current.form,
              bankAccount: {
                ...current.form.bankAccount,
                branchCheckDigit: "",
              },
              pagarmeDraft: {
                ...current.form.pagarmeDraft,
                bankAccount: {
                  ...current.form.pagarmeDraft.bankAccount,
                  branchCheckDigit: "",
                },
              },
            },
          }
        : current,
    );
  }, [state]);

  if (loading) {
    if (!isPageMode) {
      return null;
    }

    return (
      <div className="px-6 py-8">
        <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
          Carregando cadastro complementar...
        </div>
      </div>
    );
  }

  if (!state || dismissed || (!isPageMode && state.pendingFields.length === 0)) {
    return null;
  }

  const currentState = state;
  const form = currentState.form;
  const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
  const bankCode = form.bankAccount.bankCode.trim();
  const branchHasCheckDigit = bankHasBranchCheckDigit(bankCode);
  const selectedBankOption = findBankOptionByCode(bankCode);
  const bankSelectValue = useCustomBankCode ? OTHER_BANK_OPTION_VALUE : (selectedBankOption?.value ?? "");

  function isPendingField(field: VendorPendingFieldKey) {
    return currentState.pendingFields.includes(field)
      ? VENDOR_PENDING_FIELD_LABELS[field]
      : undefined;
  }

  function update<K extends keyof PendingForm>(key: K, value: PendingForm[K]) {
    setState((current) => (current ? { ...current, form: { ...current.form, [key]: value } } : current));
    setFormError(null);
    setMessage(null);
  }

  function updatePagarmeDraft<
    K extends keyof Omit<VendorRegistrationStep3Data, "managingPartners" | "bankAccount" | "transfer">,
  >(key: K, value: string) {
    setState((current) =>
      current
        ? {
            ...current,
            form: {
              ...current.form,
              pagarmeDraft: patchStep3Field(current.form.pagarmeDraft, key, value),
            },
          }
        : current,
    );
    setMessage(null);
  }

  function updateManagingPartnerField(
    key: keyof Omit<typeof partner, "address">,
    value: string | boolean,
  ) {
    if (key === "selfDeclaredLegalRepresentative" && typeof value === "boolean") {
      setState((current) =>
        current
          ? {
              ...current,
              form: {
                ...current.form,
                pagarmeDraft: normalizeStep3Data({
                  ...current.form.pagarmeDraft,
                  managingPartners: [
                    {
                      ...(current.form.pagarmeDraft.managingPartners[0] ??
                        createEmptyStep3Data().managingPartners[0]),
                      [key]: value,
                    },
                  ],
                }),
              },
            }
          : current,
      );
      setMessage(null);
      return;
    }

    if (typeof value !== "string") {
      return;
    }

    if (key === "selfDeclaredLegalRepresentative") {
      return;
    }

    setState((current) =>
      current
        ? {
            ...current,
            form: {
              ...current.form,
              pagarmeDraft: patchManagingPartnerField(current.form.pagarmeDraft, key, value),
            },
          }
        : current,
    );
    setMessage(null);
  }

  function updateManagingPartnerAddressField(key: keyof typeof partner.address, value: string) {
    setState((current) =>
      current
        ? {
            ...current,
            form: {
              ...current.form,
              pagarmeDraft: patchManagingPartnerAddressField(current.form.pagarmeDraft, key, value),
            },
          }
        : current,
    );
    setMessage(null);
  }

  function updateBank(key: keyof VendorRegistrationStep3Data["bankAccount"], value: string) {
    setState((current) =>
      current
        ? {
            ...current,
            form: (() => {
              const nextDraft = patchBankAccountField(current.form.pagarmeDraft, key, value);

              return {
                ...current.form,
                bankAccount: nextDraft.bankAccount,
                pagarmeDraft: nextDraft,
              };
            })(),
          }
        : current,
    );
    setMessage(null);
  }

  async function handleStoreCepChange(rawValue: string) {
    const formatted = formatCep(rawValue);
    update("cep", formatted);
    setCepStatus(null);

    const rawDigits = rawValue.replace(/\D/g, "");
    cepLookupRequestIdRef.current += 1;
    const requestId = cepLookupRequestIdRef.current;

    if (rawDigits.length !== 8) {
      setIsCepLookingUp(false);
      return;
    }

    setIsCepLookingUp(true);
    setCepStatus({ tone: "info", message: "Buscando endereco pelo CEP..." });

    try {
      const result = await lookupCepDetailed(rawDigits);

      if (requestId !== cepLookupRequestIdRef.current) {
        return;
      }

      if (result.status !== "ok") {
        setCepStatus({ tone: "error", message: result.message });
        return;
      }

      setState((current) =>
        current
          ? {
              ...current,
              form: {
                ...current.form,
                cep: formatted,
                street: result.data.street || current.form.street,
                neighborhood: result.data.neighborhood || current.form.neighborhood,
                city: result.data.city || current.form.city,
                state: result.data.state || current.form.state,
              },
            }
          : current,
      );

      setCepStatus(
        result.partial
          ? {
              tone: "info",
              message:
                "CEP encontrado, mas alguns campos vieram incompletos e podem ser ajustados manualmente.",
            }
          : null,
      );
    } catch {
      if (requestId === cepLookupRequestIdRef.current) {
        setCepStatus({
          tone: "error",
          message: "Nao foi possivel consultar o CEP agora.",
        });
      }
    } finally {
      if (requestId === cepLookupRequestIdRef.current) {
        setIsCepLookingUp(false);
      }
    }
  }

  async function save() {
    const validation = validateForm(form);

    if (validation) {
      setFormError(validation);
      setMessage(null);
      return;
    }

    setSaving(true);
    setFormError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/vendor/registration-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(form)),
      });

      const body = (await response.json().catch(() => null)) as
        | VendorPendingRegistrationResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        setMessageTone("error");
        setMessage(body && "message" in body ? body.message ?? "Nao foi possivel salvar agora." : "Nao foi possivel salvar agora.");
        return;
      }

      const nextPendingFields = toPendingFieldKeyList(body && "pendingFields" in body ? body.pendingFields : []);

      if (!body || !("draft" in body) || !body.draft) {
        setMessageTone("success");
        setMessage("Cadastro salvo.");
        if (returnTo) {
          router.push(returnTo);
          router.refresh();
        }
        return;
      }

      const nextForm = createFormFromResponse(body);
      setUseCustomBankCode(
        Boolean(nextForm.bankAccount.bankCode.trim()) &&
          !findBankOptionByCode(nextForm.bankAccount.bankCode.trim()),
      );

      if (nextPendingFields.length === 0) {
        setMessageTone("success");
        setMessage("Cadastro complementar concluido. Sua conta foi liberada para vender.");
        setState(isPageMode ? { form: nextForm, pendingFields: [] } : null);
        if (returnTo) {
          router.push(returnTo);
          router.refresh();
          return;
        }
        router.refresh();
        return;
      }

      setState({
        form: nextForm,
        pendingFields: nextPendingFields,
      });
      setMessageTone("success");
      setMessage(`Cadastro salvo. Ainda faltam ${nextPendingFields.length} campos obrigatorios.`);
    } catch {
      setMessageTone("error");
      setMessage("Erro de rede ao salvar o cadastro.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={
        isPageMode
          ? "space-y-4 md:space-y-5"
          : "fixed inset-0 z-80 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8"
      }
    >
      <div
        className={`relative w-full border-2 border-[#1a1a1a] bg-[#faf8f2] ${
          isPageMode
            ? "shadow-[8px_8px_0px_rgba(35,31,32,0.08)]"
            : "max-w-5xl shadow-[8px_8px_0px_#1a1a1a]"
        }`}
      >
        <div className="h-2 w-full bg-brand-yellow" />

        <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
              Cadastro complementar do vendor
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
              Complete ou ajuste seus dados
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#1a1a1a]/70">
              {currentState.pendingFields.length > 0
                ? "Seu cadastro foi iniciado pelo time Papelito. Revise os dados preenchidos, ajuste o que for necessario e complete as pendencias obrigatorias para liberar suas vendas no marketplace."
                : "Revise os dados cadastrais e financeiros usados no onboarding do recebedor antes de voltar ao painel."}
            </p>
          </div>
          {dismissible ? (
            <button
              aria-label="Fechar"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow"
              onClick={() => setDismissed(true)}
              type="button"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          ) : returnTo && currentState.pendingFields.length === 0 ? (
            <button
              className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white"
              onClick={() => router.push(returnTo)}
              type="button"
            >
              Voltar
            </button>
          ) : null}
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
            <p className="font-black uppercase tracking-[0.16em]">Campos pendentes agora</p>
            <p className="mt-2 leading-6 text-[#1a1a1a]/80">
              {currentState.pendingFields.length > 0
                ? "Enquanto este cadastro permanecer incompleto, sua conta continua bloqueada para receber pedidos e vender."
                : "Seu cadastro esta completo. Qualquer ajuste salvo aqui passa a ser a fonte de verdade do onboarding do vendor."}
            </p>
            {currentState.pendingFields.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {currentState.pendingFields.map((field) => (
                  <span
                    className="border-2 border-[#1a1a1a] bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]"
                    key={field}
                  >
                    {VENDOR_PENDING_FIELD_LABELS[field]}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <Section title="Conta">
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                autoComplete="email"
                inputMode="email"
                label="E-mail"
                onChange={(value) => update("email", value)}
                required
                type="email"
                value={form.email}
              />
              <Field
                label="Nome"
                onChange={(value) => update("firstName", value)}
                value={form.firstName}
              />
              <Field
                label="Sobrenome"
                onChange={(value) => update("lastName", value)}
                value={form.lastName}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field
                label="Nome da loja"
                onChange={(value) => {
                  update("storeName", value);
                  if (!form.bankAccount.holderName.trim()) updateBank("holderName", value);
                }}
                required
                value={form.storeName}
              />
              <Field
                inputMode="numeric"
                label="CNPJ"
                onChange={(value) => {
                  const next = formatCnpj(value);
                  const previous = form.cnpj;
                  update("cnpj", next);
                  if (
                    form.bankAccount.holderType === "company" &&
                    (!form.bankAccount.holderDocument || form.bankAccount.holderDocument === previous)
                  ) {
                    updateBank("holderDocument", next);
                  }
                }}
                required
                value={form.cnpj}
              />
              <Field
                inputMode="tel"
                label="Telefone"
                onChange={(value) => update("phoneNumber", formatPhone(value))}
                value={form.phoneNumber}
              />
            </div>
          </Section>

          <Section title="Endereco e cobertura">
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                inputMode="numeric"
                label="CEP da loja"
                helpText="Use o CEP para preencher logradouro, bairro, cidade e estado automaticamente."
                helperText={
                  isCepLookingUp
                    ? "Buscando endereco pelo CEP..."
                    : cepStatus?.tone === "info"
                      ? cepStatus.message
                      : undefined
                }
                onChange={(value) => {
                  void handleStoreCepChange(value);
                }}
                error={cepStatus?.tone === "error" ? cepStatus.message : undefined}
                value={form.cep}
              />
              <AdminSelectField
                label="Estado"
                helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                onChange={(value) => update("state", value)}
                options={REVENDEDOR_STATE_OPTIONS}
                placeholder="Selecione"
                value={form.state}
                variant="vendor-create"
              />
              <Field
                helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                label="Cidade"
                onChange={(value) => update("city", value)}
                value={form.city}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                label="Rua / Logradouro"
                onChange={(value) => update("street", value)}
                required
                value={form.street}
              />
              <Field
                helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                label="Bairro"
                onChange={(value) => update("neighborhood", value)}
                required
                value={form.neighborhood}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Numero"
                onChange={(value) => update("number", value.replace(/[^\dA-Za-z-]/g, ""))}
                required
                value={form.number}
              />
              <Field
                label="Complemento"
                onChange={(value) => update("complement", value)}
                value={form.complement}
              />
            </div>

            <div className="mt-4">
              <VendorCoverageRangesField
                onChangeRanges={(coverageRanges) => update("coverageRanges", coverageRanges)}
                ranges={form.coverageRanges}
                required
                variant="vendor-create"
              />
            </div>
          </Section>

          <Section title="KYC da empresa">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                error={isPendingField("companyName")}
                label="Razao social"
                onChange={(value) => updatePagarmeDraft("companyName", value)}
                value={form.pagarmeDraft.companyName}
              />
              <Field
                error={isPendingField("tradingName")}
                label="Nome fantasia"
                onChange={(value) => updatePagarmeDraft("tradingName", value)}
                value={form.pagarmeDraft.tradingName}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <AdminSelectField
                label="Natureza juridica"
                onChange={(value) => {
                  updatePagarmeDraft("corporationTypeSelection", value);
                  updatePagarmeDraft(
                    "corporationType",
                    value === "outro" ? form.pagarmeDraft.corporationTypeOther : value,
                  );
                }}
                options={REVENDEDOR_CORPORATION_TYPE_OPTIONS}
                placeholder="Selecione"
                value={form.pagarmeDraft.corporationTypeSelection}
                variant="vendor-create"
              />
              <Field
                error={isPendingField("foundingDate")}
                label="Data de fundacao"
                onChange={(value) => updatePagarmeDraft("foundingDate", value)}
                type="date"
                value={form.pagarmeDraft.foundingDate}
              />
              <Field
                error={isPendingField("annualRevenue")}
                label="Faturamento anual"
                onChange={(value) => updatePagarmeDraft("annualRevenue", value)}
                type="number"
                value={form.pagarmeDraft.annualRevenue}
              />
            </div>

            {form.pagarmeDraft.corporationTypeSelection === "outro" ? (
              <div className="mt-4">
                <Field
                  error={isPendingField("corporationType")}
                  label="Qual e a natureza juridica?"
                  onChange={(value) => {
                    updatePagarmeDraft("corporationTypeOther", value);
                    updatePagarmeDraft("corporationType", value);
                  }}
                  value={form.pagarmeDraft.corporationTypeOther}
                />
              </div>
            ) : null}
          </Section>

          <Section title="Responsavel legal / socio administrador">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                error={isPendingField("partner.name")}
                label="Nome completo"
                onChange={(value) => updateManagingPartnerField("name", value)}
                value={partner.name}
              />
              <Field
                error={isPendingField("partner.email")}
                label="E-mail"
                onChange={(value) => updateManagingPartnerField("email", value)}
                type="email"
                value={partner.email}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field
                error={isPendingField("partner.document")}
                inputMode="numeric"
                label="CPF"
                onChange={(value) => updateManagingPartnerField("document", formatCpf(value))}
                value={partner.document}
              />
              <Field
                error={isPendingField("partner.motherName")}
                label="Nome da mae"
                onChange={(value) => updateManagingPartnerField("motherName", value)}
                value={partner.motherName}
              />
              <Field
                error={isPendingField("partner.birthdate")}
                label="Data de nascimento"
                onChange={(value) => updateManagingPartnerField("birthdate", value)}
                type="date"
                value={partner.birthdate}
              />
              <Field
                error={isPendingField("partner.monthlyIncome")}
                label="Renda mensal"
                onChange={(value) => updateManagingPartnerField("monthlyIncome", value)}
                type="number"
                value={partner.monthlyIncome}
              />
              <Field
                error={isPendingField("partner.professionalOccupation")}
                label="Ocupacao profissional"
                onChange={(value) => updateManagingPartnerField("professionalOccupation", value)}
                value={partner.professionalOccupation}
              />
              <AdminSelectField
                label="Representante legal autodeclarado"
                onChange={(value) =>
                  updateManagingPartnerField("selfDeclaredLegalRepresentative", value === "sim")
                }
                options={[
                  { label: "Sim", value: "sim" },
                  { label: "Nao", value: "nao" },
                ]}
                placeholder="Selecione"
                value={partner.selfDeclaredLegalRepresentative === false ? "nao" : "sim"}
                variant="vendor-create"
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field
                error={isPendingField("partner.address.zipCode")}
                inputMode="numeric"
                label="CEP do responsavel"
                onChange={(value) => updateManagingPartnerAddressField("zipCode", formatCep(value))}
                value={partner.address.zipCode}
              />
              <Field
                error={isPendingField("partner.address.street")}
                label="Rua do responsavel"
                onChange={(value) => updateManagingPartnerAddressField("street", value)}
                value={partner.address.street}
              />
              <Field
                error={isPendingField("partner.address.streetNumber")}
                label="Numero"
                onChange={(value) =>
                  updateManagingPartnerAddressField("streetNumber", value.replace(/[^\dA-Za-z-]/g, ""))
                }
                value={partner.address.streetNumber}
              />
              <Field
                label="Complemento"
                onChange={(value) => updateManagingPartnerAddressField("complement", value)}
                value={partner.address.complement}
              />
              <Field
                error={isPendingField("partner.address.neighborhood")}
                label="Bairro"
                onChange={(value) => updateManagingPartnerAddressField("neighborhood", value)}
                value={partner.address.neighborhood}
              />
              <Field
                error={isPendingField("partner.address.city")}
                label="Cidade"
                onChange={(value) => updateManagingPartnerAddressField("city", value)}
                value={partner.address.city}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminSelectField
                label="Estado do responsavel"
                onChange={(value) => updateManagingPartnerAddressField("state", value)}
                options={REVENDEDOR_STATE_OPTIONS}
                placeholder="Selecione"
                value={partner.address.state}
                variant="vendor-create"
              />
              <AdminSelectField
                label="Tem socio administrador?"
                onChange={(value) => updatePagarmeDraft("hasManagingPartner", value === "no" ? "no" : "yes")}
                options={[
                  { label: "Sim", value: "yes" },
                  { label: "Nao", value: "no" },
                ]}
                placeholder="Selecione"
                value={form.pagarmeDraft.hasManagingPartner}
                variant="vendor-create"
              />
            </div>
          </Section>

          <Section title="Dados bancarios">
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                error={isPendingField("bankAccount.holderName")}
                label="Titular"
                onChange={(value) => updateBank("holderName", value)}
                value={form.bankAccount.holderName}
              />
              <AdminSelectField
                label="Tipo do titular"
                onChange={(value) => {
                  const holderType = value === "individual" ? "individual" : "company";
                  updateBank("holderType", holderType);
                  updateBank("holderDocument", holderType === "company" ? form.cnpj : "");
                }}
                options={[
                  { label: "Pessoa juridica", value: "company" },
                  { label: "Pessoa fisica", value: "individual" },
                ]}
                placeholder="Selecione"
                value={form.bankAccount.holderType}
                variant="vendor-create"
              />
              <Field
                error={isPendingField("bankAccount.holderDocument")}
                inputMode="numeric"
                label={form.bankAccount.holderType === "company" ? "CNPJ do titular" : "CPF do titular"}
                onChange={(value) =>
                  updateBank(
                    "holderDocument",
                    form.bankAccount.holderType === "company" ? formatCnpj(value) : formatCpf(value),
                  )
                }
                value={form.bankAccount.holderDocument}
              />
              <AdminSelectField
                label="Banco"
                helpText="Selecione um banco da lista ou use Outro para informar manualmente o codigo de 3 digitos."
                onChange={(value) => {
                  if (value === OTHER_BANK_OPTION_VALUE) {
                    setUseCustomBankCode(true);
                    updateBank("bankCode", "");
                    return;
                  }

                  setUseCustomBankCode(false);
                  updateBank("bankCode", value);
                }}
                options={ADMIN_BANK_OPTIONS}
                placeholder="Selecione"
                value={bankSelectValue}
                variant="vendor-create"
              />
              {useCustomBankCode ? (
                <Field
                  error={isPendingField("bankAccount.bankCode")}
                  inputMode="numeric"
                  label="Codigo do banco"
                  onChange={(value) => updateBank("bankCode", digits(value, 3))}
                  placeholder="000"
                  value={form.bankAccount.bankCode}
                />
              ) : null}
              <Field
                error={isPendingField("bankAccount.branchNumber")}
                inputMode="numeric"
                label="Agencia"
                onChange={(value) => updateBank("branchNumber", digits(value))}
                value={form.bankAccount.branchNumber}
              />
              <Field
                disabled={!branchHasCheckDigit}
                label="Digito agencia"
                placeholder={branchHasCheckDigit ? undefined : "Nao se aplica"}
                onChange={(value) =>
                  updateBank("branchCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))
                }
                value={branchHasCheckDigit ? form.bankAccount.branchCheckDigit : ""}
              />
              <Field
                error={isPendingField("bankAccount.accountNumber")}
                inputMode="numeric"
                label="Conta"
                onChange={(value) => updateBank("accountNumber", digits(value))}
                value={form.bankAccount.accountNumber}
              />
              <Field
                error={isPendingField("bankAccount.accountCheckDigit")}
                label="Digito conta"
                onChange={(value) =>
                  updateBank("accountCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))
                }
                value={form.bankAccount.accountCheckDigit}
              />
              <AdminSelectField
                label="Tipo da conta"
                onChange={(value) => updateBank("type", value === "savings" ? "savings" : "checking")}
                options={[
                  { label: "Conta corrente", value: "checking" },
                  { label: "Conta poupanca", value: "savings" },
                ]}
                placeholder="Selecione"
                value={form.bankAccount.type}
                variant="vendor-create"
              />
            </div>
          </Section>

          {formError ? (
            <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3">
              <p className="text-sm font-bold text-[#c0392b]">⚠ {formError}</p>
            </div>
          ) : null}

          {message ? (
            <div
              className={`border-2 px-4 py-3 text-sm font-bold ${
                messageTone === "error"
                  ? "border-[#c0392b] bg-[#c0392b]/10 text-[#c0392b]"
                  : "border-[#1a1a1a] bg-brand-yellow/40 text-[#1a1a1a]"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
          {dismissible ? (
            <button
              className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              onClick={() => setDismissed(true)}
              type="button"
            >
              Pular por agora
            </button>
          ) : returnTo && currentState.pendingFields.length === 0 ? (
            <button
              className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              onClick={() => router.push(returnTo)}
              type="button"
            >
              Voltar ao painel
            </button>
          ) : null}
          <button
            className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            onClick={() => {
              void save();
            }}
            type="button"
          >
            {saving ? "Salvando..." : "Salvar cadastro"}
          </button>
        </div>
      </div>
    </div>
  );
}
