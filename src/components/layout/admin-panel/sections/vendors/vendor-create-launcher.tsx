"use client";

import { Loader2, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  REVENDEDOR_DISCOVERY_OPTIONS,
  REVENDEDOR_SOLD_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
} from "@/features/revendedor/constants/revendedor-content";
import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";
import {
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCep,
  isValidCnpj,
  isValidEmail,
  sanitizeInstagramHandle,
} from "@/features/revendedor/utils/revendedor-formatters";
import { formatCpf, isValidCpf } from "@/features/revendedor/utils/revendedor-registration";
import { AdminSelectField } from "../products/components/admin-select-field";

type CoverageRange = { minCep: string; maxCep: string };

type VendorCreateForm = Omit<AdminVendorCreatePayload, "coverageRanges" | "bankAccount"> & {
  coverageRanges: CoverageRange[];
  bankAccount: AdminVendorCreatePayload["bankAccount"];
};

type CreatedVendor = {
  email?: string;
  id?: number;
  storeName?: string;
};

const INITIAL_FORM: VendorCreateForm = {
  email: "",
  storeName: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  cnpj: "",
  instagram: "",
  state: "",
  city: "",
  cep: "",
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
};

function digits(value: string, max?: number) {
  const clean = value.replace(/\D/g, "");
  return typeof max === "number" ? clean.slice(0, max) : clean;
}

function fieldClass(hasError = false) {
  return [
    "mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#231f20] outline-none transition",
    "placeholder:text-[#231f20]/36 focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]/20",
    hasError ? "border-[#b91c1c]" : "border-[#231f20]/14",
  ].join(" ");
}

function Field({
  autoComplete,
  error,
  inputMode,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  error?: string;
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
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4b4731]">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        autoComplete={autoComplete}
        className={fieldClass(Boolean(error))}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs text-[#b91c1c]">{error}</span> : null}
    </label>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="border-t border-[#231f20]/10 pt-5 first:border-t-0 first:pt-0">
      <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/58">
        {title}
      </h4>
      {children}
    </section>
  );
}

function validateForm(form: VendorCreateForm): string | null {
  if (!isValidEmail(form.email)) return "Informe um e-mail valido.";
  if (!isValidCnpj(form.cnpj)) return "Informe um CNPJ valido.";

  if (form.coverageRanges.length === 0) return "Informe ao menos uma faixa de CEP.";
  for (const [index, range] of form.coverageRanges.entries()) {
    if (!isValidCep(range.minCep) || !isValidCep(range.maxCep)) {
      return `Informe CEP inicial e final validos na faixa ${index + 1}.`;
    }
    if (Number(digits(range.minCep)) > Number(digits(range.maxCep))) {
      return `O CEP final precisa ser maior ou igual ao inicial na faixa ${index + 1}.`;
    }
  }

  const bank = form.bankAccount;
  if (!bank.holderName.trim()) return "Informe o titular da conta.";
  if (bank.holderType === "company" && !isValidCnpj(bank.holderDocument)) {
    return "Informe um CNPJ valido para o titular.";
  }
  if (bank.holderType === "individual" && !isValidCpf(bank.holderDocument)) {
    return "Informe um CPF valido para o titular.";
  }
  if (!/^\d{3}$/.test(bank.bankCode)) return "Informe o codigo bancario com 3 digitos.";
  if (!/^\d+$/.test(bank.branchNumber)) return "Informe uma agencia valida.";
  if (!/^\d+$/.test(bank.accountNumber)) return "Informe uma conta valida.";
  if (!/^[0-9A-Za-z]+$/.test(bank.accountCheckDigit)) return "Informe o digito da conta.";
  return null;
}

function buildPayload(form: VendorCreateForm): AdminVendorCreatePayload {
  return {
    ...form,
    email: form.email.trim(),
    storeName: form.storeName?.trim(),
    firstName: form.firstName?.trim(),
    lastName: form.lastName?.trim(),
    phoneNumber: form.phoneNumber?.trim(),
    cnpj: form.cnpj.trim(),
    instagram: form.instagram?.trim(),
    state: form.state?.trim(),
    city: form.city?.trim(),
    cep: form.cep?.trim(),
    discoveryChannel: form.discoveryChannel?.trim(),
    hasSoldPapelito: form.hasSoldPapelito?.trim(),
    coverageRanges: form.coverageRanges.map((range) => ({
      minCep: range.minCep.trim(),
      maxCep: range.maxCep.trim(),
    })),
    bankAccount: {
      ...form.bankAccount,
      holderName: form.bankAccount.holderName.trim(),
      holderDocument: form.bankAccount.holderDocument.trim(),
      branchCheckDigit: form.bankAccount.branchCheckDigit?.trim(),
      accountCheckDigit: form.bankAccount.accountCheckDigit.trim(),
    },
  };
}

export function VendorCreateLauncher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<VendorCreateForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdVendor, setCreatedVendor] = useState<CreatedVendor | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) setIsOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, submitting]);

  function update<K extends keyof VendorCreateForm>(key: K, value: VendorCreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBank<K extends keyof VendorCreateForm["bankAccount"]>(
    key: K,
    value: VendorCreateForm["bankAccount"][K],
  ) {
    setForm((prev) => ({ ...prev, bankAccount: { ...prev.bankAccount, [key]: value } }));
  }

  function updateCoverage(index: number, key: keyof CoverageRange, value: string) {
    setForm((prev) => ({
      ...prev,
      coverageRanges: prev.coverageRanges.map((range, currentIndex) =>
        currentIndex === index ? { ...range, [key]: value } : range,
      ),
    }));
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

      setForm(INITIAL_FORM);
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            Operacao
          </p>
          <h2 className="text-xl font-semibold text-[#231f20]">Vendors</h2>
        </div>
        <button
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#231f20] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#ffe500] transition hover:bg-black"
          onClick={() => {
            setError(null);
            setCreatedVendor(null);
            setIsOpen(true);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          Adicionar vendor
        </button>
      </div>

      {createdVendor?.id ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#b9d7aa] bg-[#f1faed] px-4 py-3 text-sm text-[#275319]">
          <span>
            Vendor criado: {createdVendor.storeName || createdVendor.email || `#${createdVendor.id}`}.
          </span>
          <Link className="font-semibold underline" href={`/admin/vendors/${createdVendor.id}`}>
            Abrir cadastro
          </Link>
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-modal="true"
          aria-labelledby="vendor-create-title"
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8"
          onClick={() => !submitting && setIsOpen(false)}
          role="dialog"
        >
          <form
            className="relative w-full max-w-5xl rounded-2xl bg-[#fffdf6] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-2xl border-b border-[#231f20]/10 bg-[#fffdf6] px-6 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4b4731]">
                  Criacao direta
                </p>
                <h3 id="vendor-create-title" className="text-lg font-semibold text-[#1e1c10]">
                  Adicionar vendor
                </h3>
              </div>
              <button
                aria-label="Fechar"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
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
                  <Field
                    label="Instagram"
                    onChange={(value) => update("instagram", sanitizeInstagramHandle(value))}
                    value={form.instagram ?? ""}
                  />
                  <AdminSelectField
                    label="Origem"
                    onChange={(value) => update("discoveryChannel", value)}
                    options={REVENDEDOR_DISCOVERY_OPTIONS}
                    placeholder="Selecione"
                    value={form.discoveryChannel ?? ""}
                  />
                  <AdminSelectField
                    label="Ja vende Papelito?"
                    onChange={(value) => update("hasSoldPapelito", value)}
                    options={[{ label: "Selecione", value: "" }, ...REVENDEDOR_SOLD_OPTIONS]}
                    placeholder="Selecione"
                    value={form.hasSoldPapelito ?? ""}
                  />
                </div>
              </Section>

              <Section title="Endereco e cobertura">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    inputMode="numeric"
                    label="CEP da loja"
                    onChange={(value) => update("cep", formatCep(value))}
                    value={form.cep ?? ""}
                  />
                  <AdminSelectField
                    label="Estado"
                    onChange={(value) => update("state", value)}
                    options={REVENDEDOR_STATE_OPTIONS}
                    placeholder="Selecione"
                    value={form.state ?? ""}
                  />
                  <Field label="Cidade" onChange={(value) => update("city", value)} value={form.city ?? ""} />
                </div>

                <div className="mt-4 space-y-3">
                  {form.coverageRanges.map((range, index) => (
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" key={`coverage-${index}`}>
                      <Field
                        inputMode="numeric"
                        label={`CEP inicial ${index + 1}`}
                        onChange={(value) => updateCoverage(index, "minCep", formatCep(value))}
                        required={index === 0}
                        value={range.minCep}
                      />
                      <Field
                        inputMode="numeric"
                        label={`CEP final ${index + 1}`}
                        onChange={(value) => updateCoverage(index, "maxCep", formatCep(value))}
                        required={index === 0}
                        value={range.maxCep}
                      />
                      <button
                        aria-label="Remover faixa"
                        className="mt-7 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#d8cfb4] bg-white text-[#7a3428] transition hover:border-[#7a3428] disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={form.coverageRanges.length === 1}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            coverageRanges: prev.coverageRanges.filter((_, currentIndex) => currentIndex !== index),
                          }))
                        }
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#cec7aa] bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#1e1c10] transition hover:bg-[#f6f1da]"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        coverageRanges: [...prev.coverageRanges, { minCep: "", maxCep: "" }],
                      }))
                    }
                    type="button"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    Faixa de CEP
                  </button>
                </div>
              </Section>

              <Section title="Dados bancarios">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Titular"
                    onChange={(value) => updateBank("holderName", value)}
                    required
                    value={form.bankAccount.holderName}
                  />
                  <AdminSelectField
                    label="Tipo do titular *"
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
                    required
                    value={form.bankAccount.holderDocument}
                  />
                  <Field
                    inputMode="numeric"
                    label="Banco"
                    onChange={(value) => updateBank("bankCode", digits(value, 3))}
                    placeholder="001"
                    required
                    value={form.bankAccount.bankCode}
                  />
                  <Field
                    inputMode="numeric"
                    label="Agencia"
                    onChange={(value) => updateBank("branchNumber", digits(value))}
                    required
                    value={form.bankAccount.branchNumber}
                  />
                  <Field
                    label="Digito agencia"
                    onChange={(value) => updateBank("branchCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))}
                    value={form.bankAccount.branchCheckDigit ?? ""}
                  />
                  <Field
                    inputMode="numeric"
                    label="Conta"
                    onChange={(value) => updateBank("accountNumber", digits(value))}
                    required
                    value={form.bankAccount.accountNumber}
                  />
                  <Field
                    label="Digito conta"
                    onChange={(value) => updateBank("accountCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))}
                    required
                    value={form.bankAccount.accountCheckDigit}
                  />
                  <AdminSelectField
                    label="Tipo da conta *"
                    onChange={(value) => updateBank("type", value === "savings" ? "savings" : "checking")}
                    options={[
                      { label: "Conta corrente", value: "checking" },
                      { label: "Conta poupanca", value: "savings" },
                    ]}
                    placeholder="Selecione"
                    value={form.bankAccount.type}
                  />
                </div>
              </Section>

              {error ? (
                <p className="rounded-xl border border-[#d7b0aa] bg-[#fef3f1] px-4 py-3 text-sm text-[#7a3428]">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 rounded-b-2xl border-t border-[#231f20]/10 bg-[#fffdf6] px-6 py-4">
              <button
                className="inline-flex h-10 cursor-pointer items-center rounded-xl border border-[#cec7aa] bg-white px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#1e1c10] transition hover:bg-[#f6f1da] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#231f20] px-5 text-xs font-semibold uppercase tracking-[0.08em] text-[#ffe500] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
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
