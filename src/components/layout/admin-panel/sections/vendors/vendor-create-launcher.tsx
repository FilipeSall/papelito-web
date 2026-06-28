"use client";

import { Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import type { VendorRegistrationStep3Data } from "@/features/revendedor/types/revendedor-application";
import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";
import {
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCep,
  isValidCnpj,
  isValidEmail,
} from "@/features/revendedor/utils/revendedor-formatters";
import { validateCoverageRanges } from "@/features/vendor-coverage/coverage-presets";
import {
  createEmptyStep3Data,
  formatCpf,
} from "@/features/revendedor/utils/revendedor-registration";
import { lookupCepDetailed } from "@/features/checkout/services/lookup-cep";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { AdminSelectField } from "../products/components/admin-select-field";
import { InfoTooltip } from "../products/components/form-fields";

type CoverageRange = { minCep: string; maxCep: string };

type VendorCreateForm = Omit<AdminVendorCreatePayload, "coverageRanges" | "bankAccount" | "pagarmeDraft"> & {
  coverageRanges: CoverageRange[];
  bankAccount: AdminVendorCreatePayload["bankAccount"];
  pagarmeDraft: VendorRegistrationStep3Data;
};

type CreatedVendor = {
  email?: string;
  id?: number;
  storeName?: string;
};

export type VendorCreateSourceUser = {
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

function createInitialForm(): VendorCreateForm {
  return {
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

function createFormFromSourceUser(sourceUser?: VendorCreateSourceUser | null): VendorCreateForm {
  const form = createInitialForm();

  if (!sourceUser) {
    return form;
  }

  const fullName = `${sourceUser.firstName} ${sourceUser.lastName}`.trim() || sourceUser.name.trim();
  const storeName = sourceUser.storeName.trim() || fullName;
  const partner = form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];

  return {
    ...form,
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
    bankAccount: {
      ...form.bankAccount,
      holderDocument: sourceUser.cnpj.trim(),
      holderName: storeName || fullName,
    },
    pagarmeDraft: {
      ...form.pagarmeDraft,
      managingPartners: [
        {
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
        },
      ],
    },
  };
}

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
      <span className="flex h-4 items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]">
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
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" aria-hidden="true" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          {title}
        </h4>
      </div>
      {children}
    </section>
  );
}

function validateForm(form: VendorCreateForm): string | null {
  if (!isValidEmail(form.email)) return "Informe um e-mail valido.";
  if (!form.temporaryPassword.trim()) return "Informe uma senha temporaria para o vendor.";
  if (!form.storeName?.trim()) return "Informe o nome da loja.";
  if (!isValidCnpj(form.cnpj)) return "Informe um CNPJ valido.";
  if (!isValidCep(form.cep ?? "")) return "Informe um CEP valido para a loja.";
  if (!form.street?.trim()) return "Informe o logradouro da loja.";
  if (!form.number?.trim()) return "Informe o numero da loja.";
  if (!form.neighborhood?.trim()) return "Informe o bairro da loja.";
  if (!form.city?.trim()) return "Informe a cidade da loja.";
  if (!form.state?.trim()) return "Informe o estado da loja.";

  const coverageError = validateCoverageRanges(form.coverageRanges);
  if (coverageError) return coverageError;

  return null;
}

function buildAdminPagarmeDraft(form: VendorCreateForm): VendorRegistrationStep3Data {
  const partner =
    form.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];
  const fallbackPartnerName = `${form.firstName ?? ""} ${form.lastName ?? ""}`.trim();

  return {
    ...form.pagarmeDraft,
    companyName: form.pagarmeDraft.companyName.trim(),
    tradingName: form.pagarmeDraft.tradingName.trim(),
    bankAccount: {
      ...form.bankAccount,
      branchCheckDigit: form.bankAccount.branchCheckDigit ?? "",
    },
    managingPartners: [
      {
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
      },
    ],
  };
}

function buildPayload(form: VendorCreateForm): AdminVendorCreatePayload {
  return {
    ...form,
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
    coverageRanges: form.coverageRanges.map((range) => ({
      minCep: range.minCep.trim(),
      maxCep: range.maxCep.trim(),
    })),
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

export function VendorCreateLauncher({
  initialOpen = false,
  sourceUser = null,
}: {
  initialOpen?: boolean;
  sourceUser?: VendorCreateSourceUser | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<VendorCreateForm>(() => createFormFromSourceUser(sourceUser));
  const [useCustomBankCode, setUseCustomBankCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVendor, setCreatedVendor] = useState<CreatedVendor | null>(null);
  const [prefillSource, setPrefillSource] = useState<VendorCreateSourceUser | null>(
    initialOpen ? sourceUser : null,
  );
  const [cepStatus, setCepStatus] = useState<{
    tone: "error" | "info";
    message: string;
  } | null>(null);
  const [isCepLookingUp, setIsCepLookingUp] = useState(false);
  const cepLookupRequestIdRef = useRef(0);
  const autoOpenedRef = useRef(false);
  const bankCode = form.bankAccount.bankCode.trim();
  const branchHasCheckDigit = bankHasBranchCheckDigit(bankCode);
  const selectedBankOption = findBankOptionByCode(bankCode);
  const bankSelectValue = useCustomBankCode ? OTHER_BANK_OPTION_VALUE : (selectedBankOption?.value ?? "");

  useEffect(() => {
    if (bankCode && !selectedBankOption) {
      setUseCustomBankCode(true);
    }
  }, [bankCode, selectedBankOption]);

  useEffect(() => {
    if (branchHasCheckDigit || !form.bankAccount.branchCheckDigit) {
      return;
    }

    updateBank("branchCheckDigit", "");
  }, [branchHasCheckDigit, form.bankAccount.branchCheckDigit]);

  useEscapeKey(() => setIsOpen(false), { enabled: isOpen && !submitting });

  useEffect(() => {
    if (!initialOpen || autoOpenedRef.current) {
      return;
    }

    autoOpenedRef.current = true;
    setError(null);
    setCreatedVendor(null);
    setCepStatus(null);
    setIsCepLookingUp(false);
    setUseCustomBankCode(false);
    setPrefillSource(sourceUser ?? null);
    setForm(createFormFromSourceUser(sourceUser));
    setIsOpen(true);
    router.replace("/admin/vendors", { scroll: false });
  }, [initialOpen, router, sourceUser]);

  function update<K extends keyof VendorCreateForm>(key: K, value: VendorCreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBank<K extends keyof VendorCreateForm["bankAccount"]>(
    key: K,
    value: VendorCreateForm["bankAccount"][K],
  ) {
    setForm((prev) => ({ ...prev, bankAccount: { ...prev.bankAccount, [key]: value } }));
  }

  function updatePagarmeDraft<K extends keyof VendorRegistrationStep3Data>(
    key: K,
    value: VendorRegistrationStep3Data[K],
  ) {
    setForm((prev) => ({
      ...prev,
      pagarmeDraft: {
        ...prev.pagarmeDraft,
        [key]: value,
      },
    }));
  }

  function updateManagingPartnerField(
    key: keyof VendorRegistrationStep3Data["managingPartners"][number],
    value: string | boolean,
  ) {
    setForm((prev) => {
      const partner =
        prev.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];

      return {
        ...prev,
        pagarmeDraft: {
          ...prev.pagarmeDraft,
          managingPartners: [
            {
              ...partner,
              [key]: value,
            },
          ],
        },
      };
    });
  }

  function updateManagingPartnerAddressField(
    key: keyof VendorRegistrationStep3Data["managingPartners"][number]["address"],
    value: string,
  ) {
    setForm((prev) => {
      const partner =
        prev.pagarmeDraft.managingPartners[0] ?? createEmptyStep3Data().managingPartners[0];

      return {
        ...prev,
        pagarmeDraft: {
          ...prev.pagarmeDraft,
          managingPartners: [
            {
              ...partner,
              address: {
                ...partner.address,
                [key]: value,
              },
            },
          ],
        },
      };
    });
  }

  async function handleStoreCepChange(rawValue: string) {
    const formatted = formatCep(rawValue);
    update("cep", formatted);
    setCepStatus(null);

    const digits = rawValue.replace(/\D/g, "");
    cepLookupRequestIdRef.current += 1;
    const requestId = cepLookupRequestIdRef.current;

    if (digits.length !== 8) {
      setIsCepLookingUp(false);
      return;
    }

    setIsCepLookingUp(true);
    setCepStatus({ tone: "info", message: "Buscando endereco pelo CEP..." });

    try {
      const result = await lookupCepDetailed(digits);

      if (requestId !== cepLookupRequestIdRef.current) {
        return;
      }

      if (result.status !== "ok") {
        setCepStatus({ tone: "error", message: result.message });
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: formatted,
        street: result.data.street || prev.street,
        neighborhood: result.data.neighborhood || prev.neighborhood,
        city: result.data.city || prev.city,
        state: result.data.state || prev.state,
      }));

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setCreatedVendor(null);

    const validation = validateForm(form);
    if (validation) {
      setError(validation);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(form)),
      });
      const data = (await response.json().catch(() => null)) as {
        message?: string;
        vendor?: CreatedVendor;
      } | null;

      if (!response.ok) {
        setError(data?.message ?? "Nao foi possivel criar o vendor.");
        return;
      }

      setForm(createInitialForm());
      setUseCustomBankCode(false);
      setCreatedVendor(data?.vendor ?? null);
      setIsOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
            Operacao
          </p>
          <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">Vendors</h2>
        </div>
        <button
          className="inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none"
          onClick={() => {
            setError(null);
            setCreatedVendor(null);
            setCepStatus(null);
            setIsCepLookingUp(false);
            setUseCustomBankCode(false);
            setPrefillSource(null);
            setForm(createInitialForm());
            setIsOpen(true);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          + Novo vendor
        </button>
      </div>

      {createdVendor?.id ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-[#1a1a1a] bg-brand-yellow px-4 py-3 text-sm shadow-[4px_4px_0px_#1a1a1a]">
          <span className="font-black uppercase tracking-wide text-[#1a1a1a]">
            ✓ Vendor criado: {createdVendor.storeName || createdVendor.email || `#${createdVendor.id}`}
          </span>
          <Link className="border-b-2 border-[#1a1a1a] font-black uppercase tracking-widest text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-brand-yellow px-2" href={`/admin/vendors/${createdVendor.id}`}>
            Abrir cadastro →
          </Link>
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-modal="true"
          aria-labelledby="vendor-create-title"
          className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8"
          onClick={() => !submitting && setIsOpen(false)}
          role="dialog"
        >
          <form
            className="relative w-full max-w-5xl border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
          >
            {/* Faixa amarela decorativa no topo */}
            <div className="h-2 w-full bg-brand-yellow" />

            <div className="flex items-start justify-between gap-4 border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
                  Painel admin · criação direta
                </p>
                <h3 id="vendor-create-title" className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a]">
                  Adicionar vendor
                </h3>
              </div>
              <button
                aria-label="Fechar"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              {prefillSource ? (
                <div className="border-2 border-[#1a1a1a] bg-brand-yellow/40 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                  <p className="font-black uppercase tracking-[0.16em]">
                    Dados importados do usuario #{prefillSource.id}
                  </p>
                  <p className="mt-2 leading-6">
                    Nome, email, contato e endereco vieram da conta selecionada no painel de
                    usuarios. Ajuste o que faltar antes de criar o vendor.
                  </p>
                </div>
              ) : null}

              <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <p className="font-black uppercase tracking-[0.16em]">Preenchimento minimo do admin</p>
                <p className="mt-2 leading-6">
                  Os unicos blocos obrigatorios para o admin preencher agora sao <strong>Conta</strong>, <strong>Dados comerciais</strong> e <strong>Endereco e cobertura</strong>. <strong>KYC da empresa</strong>, <strong>Responsavel legal / socio administrador</strong> e <strong>Dados bancarios</strong> podem ficar incompletos e depois serao exigidos do vendor.
                </p>
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
                    value={form.firstName ?? ""}
                  />
                  <Field
                    label="Sobrenome"
                    onChange={(value) => update("lastName", value)}
                    value={form.lastName ?? ""}
                  />
                  <Field
                    autoComplete="off"
                    helpText="Informe uma senha temporaria para o primeiro acesso do vendor. Essa senha deve ser comunicada ao vendor e alterada por ele apos o login."
                    label="Senha temporaria"
                    onChange={(value) => update("temporaryPassword", value)}
                    required
                    type="text"
                    value={form.temporaryPassword}
                  />
                </div>
              </Section>

              <Section title="Dados comerciais">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Nome da loja"
                    onChange={(value) => {
                      update("storeName", value);
                      if (!form.bankAccount.holderName.trim()) updateBank("holderName", value);
                    }}
                    required
                    value={form.storeName ?? ""}
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
                    value={form.phoneNumber ?? ""}
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
                    value={form.cep ?? ""}
                  />
                  <AdminSelectField
                    label="Estado"
                    helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                    onChange={(value) => update("state", value)}
                    options={REVENDEDOR_STATE_OPTIONS}
                    placeholder="Selecione"
                    value={form.state ?? ""}
                    variant="vendor-create"
                  />
                  <Field
                    helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                    label="Cidade"
                    onChange={(value) => update("city", value)}
                    value={form.city ?? ""}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field
                    helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                    label="Rua / Logradouro"
                    onChange={(value) => update("street", value)}
                    required
                    value={form.street ?? ""}
                  />
                  <Field
                    helpText="Pode ser ajustado manualmente se a busca vier incompleta."
                    label="Bairro"
                    onChange={(value) => update("neighborhood", value)}
                    required
                    value={form.neighborhood ?? ""}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Numero"
                    onChange={(value) => update("number", value.replace(/[^\dA-Za-z-]/g, ""))}
                    required
                    value={form.number ?? ""}
                  />
                  <Field
                    label="Complemento"
                    onChange={(value) => update("complement", value)}
                    value={form.complement ?? ""}
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
                    label="Razao social"
                    onChange={(value) => updatePagarmeDraft("companyName", value)}
                    value={form.pagarmeDraft.companyName}
                  />
                  <Field
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
                    label="Data de fundacao"
                    onChange={(value) => updatePagarmeDraft("foundingDate", value)}
                    type="date"
                    value={form.pagarmeDraft.foundingDate}
                  />
                  <Field
                    label="Faturamento anual"
                    onChange={(value) => updatePagarmeDraft("annualRevenue", value)}
                    type="number"
                    value={form.pagarmeDraft.annualRevenue}
                  />
                </div>

                {form.pagarmeDraft.corporationTypeSelection === "outro" ? (
                  <div className="mt-4">
                    <Field
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
                    label="Nome completo"
                    onChange={(value) => updateManagingPartnerField("name", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.name ?? ""}
                  />
                  <Field
                    label="E-mail"
                    onChange={(value) => updateManagingPartnerField("email", value)}
                    type="email"
                    value={form.pagarmeDraft.managingPartners[0]?.email ?? ""}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field
                    inputMode="numeric"
                    label="CPF"
                    onChange={(value) => updateManagingPartnerField("document", formatCpf(value))}
                    value={form.pagarmeDraft.managingPartners[0]?.document ?? ""}
                  />
                  <Field
                    label="Nome da mae"
                    onChange={(value) => updateManagingPartnerField("motherName", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.motherName ?? ""}
                  />
                  <Field
                    label="Data de nascimento"
                    onChange={(value) => updateManagingPartnerField("birthdate", value)}
                    type="date"
                    value={form.pagarmeDraft.managingPartners[0]?.birthdate ?? ""}
                  />
                  <Field
                    label="Renda mensal"
                    onChange={(value) => updateManagingPartnerField("monthlyIncome", value)}
                    type="number"
                    value={form.pagarmeDraft.managingPartners[0]?.monthlyIncome ?? ""}
                  />
                  <Field
                    label="Ocupacao profissional"
                    onChange={(value) => updateManagingPartnerField("professionalOccupation", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.professionalOccupation ?? ""}
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
                    value={
                      form.pagarmeDraft.managingPartners[0]?.selfDeclaredLegalRepresentative === false
                        ? "nao"
                        : "sim"
                    }
                    variant="vendor-create"
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field
                    inputMode="numeric"
                    label="CEP do responsavel"
                    onChange={(value) => updateManagingPartnerAddressField("zipCode", formatCep(value))}
                    value={form.pagarmeDraft.managingPartners[0]?.address.zipCode ?? ""}
                  />
                  <Field
                    label="Rua do responsavel"
                    onChange={(value) => updateManagingPartnerAddressField("street", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.address.street ?? ""}
                  />
                  <Field
                    label="Numero"
                    onChange={(value) =>
                      updateManagingPartnerAddressField("streetNumber", value.replace(/[^\dA-Za-z-]/g, ""))
                    }
                    value={form.pagarmeDraft.managingPartners[0]?.address.streetNumber ?? ""}
                  />
                  <Field
                    label="Complemento"
                    onChange={(value) => updateManagingPartnerAddressField("complement", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.address.complement ?? ""}
                  />
                  <Field
                    label="Bairro"
                    onChange={(value) => updateManagingPartnerAddressField("neighborhood", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.address.neighborhood ?? ""}
                  />
                  <Field
                    label="Cidade"
                    onChange={(value) => updateManagingPartnerAddressField("city", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.address.city ?? ""}
                  />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <AdminSelectField
                    label="Estado do responsavel"
                    onChange={(value) => updateManagingPartnerAddressField("state", value)}
                    options={REVENDEDOR_STATE_OPTIONS}
                    placeholder="Selecione"
                    value={form.pagarmeDraft.managingPartners[0]?.address.state ?? ""}
                    variant="vendor-create"
                  />
                  <AdminSelectField
                    label="Tem socio administrador?"
                    onChange={(value) =>
                      updatePagarmeDraft("hasManagingPartner", value === "no" ? "no" : "yes")
                    }
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
                      inputMode="numeric"
                      label="Codigo do banco"
                      onChange={(value) => updateBank("bankCode", digits(value, 3))}
                      placeholder="000"
                      value={form.bankAccount.bankCode}
                    />
                  ) : null}
                  <Field
                    inputMode="numeric"
                    label="Agencia"
                    onChange={(value) => updateBank("branchNumber", digits(value))}
                    value={form.bankAccount.branchNumber}
                  />
                  <Field
                    disabled={!branchHasCheckDigit}
                    label="Digito agencia"
                    placeholder={branchHasCheckDigit ? undefined : "Nao se aplica"}
                    onChange={(value) => updateBank("branchCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))}
                    value={branchHasCheckDigit ? (form.bankAccount.branchCheckDigit ?? "") : ""}
                  />
                  <Field
                    inputMode="numeric"
                    label="Conta"
                    onChange={(value) => updateBank("accountNumber", digits(value))}
                    value={form.bankAccount.accountNumber}
                  />
                  <Field
                    label="Digito conta"
                    onChange={(value) => updateBank("accountCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))}
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

              {error ? (
                <div className="border-2 border-[#c0392b] bg-[#c0392b]/10 px-4 py-3">
                  <p className="text-sm font-bold text-[#c0392b]">⚠ {error}</p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
              <button
                className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    Criando...
                  </>
                ) : (
                  "Criar vendor"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
