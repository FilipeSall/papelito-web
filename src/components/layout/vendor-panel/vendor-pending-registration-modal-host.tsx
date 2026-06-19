"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  REVENDEDOR_CORPORATION_TYPE_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
} from "@/features/revendedor/constants/revendedor-content";
import {
  OTHER_BANK_OPTION_VALUE,
  ADMIN_BANK_OPTIONS,
  findBankOptionByCode,
} from "@/features/revendedor/constants/bank-codes";
import {
  VENDOR_PENDING_FIELD_LABELS,
  VENDOR_PENDING_FIELD_SECTIONS,
  VENDOR_PENDING_SECTION_LABELS,
  VENDOR_PENDING_SECTION_ORDER,
  type VendorPendingFieldKey,
} from "@/features/revendedor/constants/pending-registration";
import type {
  RevendedorApplication,
  VendorPendingRegistrationResponse,
  VendorRegistrationStep3Data,
} from "@/features/revendedor/types/revendedor-application";
import {
  buildDraftFromSources,
  formatCpf,
  normalizeStep3Data,
  patchBankAccountField,
  patchManagingPartnerAddressField,
  patchManagingPartnerField,
  patchStep3Field,
} from "@/features/revendedor/utils/revendedor-registration";
import { formatCnpj } from "@/features/revendedor/utils/revendedor-formatters";

type PendingState = {
  draft: VendorRegistrationStep3Data;
  pendingFields: VendorPendingFieldKey[];
};

function fieldClass(isPending = false) {
  return [
    "mt-2 h-11 w-full rounded-[14px] border bg-white px-3 text-sm text-brand-dark outline-none transition",
    isPending ? "border-[#c0392b]" : "border-brand-dark/18",
    "focus:border-brand-dark",
  ].join(" ");
}

function Field({
  error,
  inputMode,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  error?: string;
  inputMode?: "email" | "numeric" | "tel" | "text";
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-dark/70">
        <span>{label}</span>
        {error ? (
          <span className="rounded-full bg-[#c0392b]/10 px-2 py-0.5 text-[10px] font-black tracking-[0.12em] text-[#c0392b]">
            Pendente
          </span>
        ) : null}
      </span>
      <input
        className={fieldClass(Boolean(error))}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  error,
  label,
  onChange,
  options,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-dark/70">
        <span>{label}</span>
        {error ? (
          <span className="rounded-full bg-[#c0392b]/10 px-2 py-0.5 text-[10px] font-black tracking-[0.12em] text-[#c0392b]">
            Pendente
          </span>
        ) : null}
      </span>
      <select className={fieldClass(Boolean(error))} onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function toPendingFieldKeyList(value: unknown): VendorPendingFieldKey[] {
  return Array.isArray(value)
    ? value.filter((field): field is VendorPendingFieldKey => typeof field === "string" && field in VENDOR_PENDING_FIELD_SECTIONS)
    : [];
}

export function VendorPendingRegistrationModalHost() {
  const router = useRouter();
  const [state, setState] = useState<PendingState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("success");
  const [useCustomBankCode, setUseCustomBankCode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/revendedor/application", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          return;
        }

        const application = (await response.json()) as RevendedorApplication;
        const pendingFields = toPendingFieldKeyList(application.pendingFields);

        if (cancelled || pendingFields.length === 0) {
          return;
        }

        const draft = buildDraftFromSources(null, application);
        const bankCode = draft.step3.bankAccount.bankCode.trim();
        setUseCustomBankCode(Boolean(bankCode) && !findBankOptionByCode(bankCode));
        setState({
          draft: draft.step3,
          pendingFields,
        });
        setDismissed(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingBySection = useMemo(() => {
    const grouped = new Map<string, VendorPendingFieldKey[]>();

    for (const field of state?.pendingFields ?? []) {
      const section = VENDOR_PENDING_FIELD_SECTIONS[field];
      const current = grouped.get(section) ?? [];
      current.push(field);
      grouped.set(section, current);
    }

    return grouped;
  }, [state?.pendingFields]);

  if (loading || !state || dismissed || state.pendingFields.length === 0) {
    return null;
  }

  const currentState = state;
  const partner = currentState.draft.managingPartners[0];
  const bankCode = currentState.draft.bankAccount.bankCode.trim();
  const selectedBankOption = findBankOptionByCode(bankCode);
  const bankSelectValue = useCustomBankCode ? OTHER_BANK_OPTION_VALUE : (selectedBankOption?.value ?? "");

  function isPendingField(field: VendorPendingFieldKey) {
    return currentState.pendingFields.includes(field) ? VENDOR_PENDING_FIELD_LABELS[field] : undefined;
  }

  function updateStep3<K extends keyof Omit<VendorRegistrationStep3Data, "managingPartners" | "bankAccount" | "transfer">>(
    key: K,
    value: string,
  ) {
    setState((current) =>
      current
        ? {
            ...current,
            draft: patchStep3Field(current.draft, key, value),
          }
        : current,
    );
    setMessage(null);
  }

  function updatePartner(
    key: keyof Omit<typeof partner, "address" | "selfDeclaredLegalRepresentative">,
    value: string,
  ) {
    setState((current) =>
      current
        ? {
            ...current,
            draft: patchManagingPartnerField(current.draft, key, value),
          }
        : current,
    );
    setMessage(null);
  }

  function updatePartnerAddress(key: keyof typeof partner.address, value: string) {
    setState((current) =>
      current
        ? {
            ...current,
            draft: patchManagingPartnerAddressField(current.draft, key, value),
          }
        : current,
    );
    setMessage(null);
  }

  function updateBank(
    key: keyof VendorRegistrationStep3Data["bankAccount"],
    value: string,
  ) {
    setState((current) =>
      current
        ? {
            ...current,
            draft: patchBankAccountField(current.draft, key, value),
          }
        : current,
    );
    setMessage(null);
  }

  async function saveDraft() {
    if (!state) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/vendor/registration-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state.draft),
      });

      const body = (await response.json().catch(() => null)) as VendorPendingRegistrationResponse | { message?: string } | null;

      if (!response.ok) {
        setMessageTone("error");
        setMessage(body && "message" in body ? body.message ?? "Nao foi possivel salvar agora." : "Nao foi possivel salvar agora.");
        return;
      }

      const nextPendingFields = toPendingFieldKeyList(body && "pendingFields" in body ? body.pendingFields : []);
      const nextDraft =
        body && "draft" in body && body.draft
          ? normalizeStep3Data(body.draft)
          : state.draft;
      setUseCustomBankCode(
        Boolean(nextDraft.bankAccount.bankCode.trim()) &&
          !findBankOptionByCode(nextDraft.bankAccount.bankCode.trim()),
      );

      if (nextPendingFields.length === 0) {
        setMessageTone("success");
        setMessage("Cadastro complementar concluido.");
        setState(null);
        router.refresh();
        return;
      }

      setState({
        draft: nextDraft,
        pendingFields: nextPendingFields,
      });
      setMessageTone("success");
      setMessage(`Rascunho salvo. Ainda faltam ${nextPendingFields.length} campos obrigatorios.`);
    } catch {
      setMessageTone("error");
      setMessage("Erro de rede ao salvar as pendencias.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border-2 border-brand-dark bg-[#fbf7ef] shadow-[10px_10px_0_rgba(35,31,32,0.16)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-brand-dark/10 bg-[#fbf7ef] px-5 py-5 md:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-dark/48">
              Cadastro complementar
            </p>
            <h2
              className="mt-1 text-2xl font-semibold uppercase tracking-[0.12em] text-brand-dark"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Complete os dados pendentes
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-dark/70">
              Seu cadastro foi criado pelo time Papelito, mas ainda faltam informacoes obrigatorias para concluir a operacao financeira e a integracao.
            </p>
          </div>
          <button
            aria-label="Fechar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-dark/12 text-brand-dark/70 transition hover:border-brand-dark hover:text-brand-dark"
            onClick={() => setDismissed(true)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5 md:px-7 md:py-6">
          <div className="rounded-[20px] border border-[#c0392b]/20 bg-[#c0392b]/6 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8d2a1e]">
              Campos pendentes agora
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentState.pendingFields.map((field) => (
                <span
                  className="rounded-full border border-[#c0392b]/25 bg-white px-3 py-1 text-xs font-semibold text-[#8d2a1e]"
                  key={field}
                >
                  {VENDOR_PENDING_FIELD_LABELS[field]}
                </span>
              ))}
            </div>
          </div>

          {VENDOR_PENDING_SECTION_ORDER.map((section) => {
            const sectionFields = pendingBySection.get(section) ?? [];

            return (
              <section className="space-y-4 rounded-[22px] border border-brand-dark/10 bg-white/70 p-5" key={section}>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-brand-dark/55">
                    {VENDOR_PENDING_SECTION_LABELS[section]}
                  </p>
                  {sectionFields.length > 0 ? (
                    <p className="mt-2 text-sm text-brand-dark/68">
                      {sectionFields.length} {sectionFields.length === 1 ? "campo pendente nesta secao." : "campos pendentes nesta secao."}
                    </p>
                  ) : null}
                </div>

                {section === "company" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field error={isPendingField("companyName")} label="Razao social" onChange={(value) => updateStep3("companyName", value)} value={currentState.draft.companyName} />
                      <Field error={isPendingField("tradingName")} label="Nome fantasia" onChange={(value) => updateStep3("tradingName", value)} value={currentState.draft.tradingName} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <SelectField
                        error={isPendingField("corporationType")}
                        label="Natureza juridica"
                        onChange={(value) => {
                          updateStep3("corporationTypeSelection", value);
                            updateStep3("corporationType", value === "outro" ? currentState.draft.corporationTypeOther : value);
                          }}
                        options={REVENDEDOR_CORPORATION_TYPE_OPTIONS}
                        value={currentState.draft.corporationTypeSelection}
                      />
                      {currentState.draft.corporationTypeSelection === "outro" ? (
                        <Field
                          error={isPendingField("corporationType")}
                          label="Outra natureza juridica"
                          onChange={(value) => {
                            updateStep3("corporationTypeOther", value);
                            updateStep3("corporationType", value);
                          }}
                          value={currentState.draft.corporationTypeOther}
                        />
                      ) : null}
                      <Field error={isPendingField("foundingDate")} label="Data de fundacao" onChange={(value) => updateStep3("foundingDate", value)} type="date" value={currentState.draft.foundingDate} />
                      <Field error={isPendingField("annualRevenue")} label="Faturamento anual" onChange={(value) => updateStep3("annualRevenue", value)} value={currentState.draft.annualRevenue} />
                    </div>
                  </>
                ) : null}

                {section === "partner" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field error={isPendingField("partner.name")} label="Nome do socio administrador" onChange={(value) => updatePartner("name", value)} value={partner?.name ?? ""} />
                      <Field error={isPendingField("partner.email")} label="E-mail do socio administrador" onChange={(value) => updatePartner("email", value)} type="email" value={partner?.email ?? ""} />
                      <Field error={isPendingField("partner.document")} inputMode="numeric" label="CPF do socio administrador" onChange={(value) => updatePartner("document", formatCpf(value))} value={partner?.document ?? ""} />
                      <Field error={isPendingField("partner.motherName")} label="Nome da mae" onChange={(value) => updatePartner("motherName", value)} value={partner?.motherName ?? ""} />
                      <Field error={isPendingField("partner.birthdate")} label="Data de nascimento" onChange={(value) => updatePartner("birthdate", value)} type="date" value={partner?.birthdate ?? ""} />
                      <Field error={isPendingField("partner.monthlyIncome")} label="Renda mensal" onChange={(value) => updatePartner("monthlyIncome", value)} value={partner?.monthlyIncome ?? ""} />
                      <Field error={isPendingField("partner.professionalOccupation")} label="Ocupacao profissional" onChange={(value) => updatePartner("professionalOccupation", value)} value={partner?.professionalOccupation ?? ""} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field error={isPendingField("partner.address.zipCode")} inputMode="numeric" label="CEP" onChange={(value) => updatePartnerAddress("zipCode", value)} value={partner?.address.zipCode ?? ""} />
                      <Field error={isPendingField("partner.address.street")} label="Logradouro" onChange={(value) => updatePartnerAddress("street", value)} value={partner?.address.street ?? ""} />
                      <Field error={isPendingField("partner.address.streetNumber")} label="Numero" onChange={(value) => updatePartnerAddress("streetNumber", value)} value={partner?.address.streetNumber ?? ""} />
                      <Field label="Complemento" onChange={(value) => updatePartnerAddress("complement", value)} value={partner?.address.complement ?? ""} />
                      <Field error={isPendingField("partner.address.neighborhood")} label="Bairro" onChange={(value) => updatePartnerAddress("neighborhood", value)} value={partner?.address.neighborhood ?? ""} />
                      <Field error={isPendingField("partner.address.city")} label="Cidade" onChange={(value) => updatePartnerAddress("city", value)} value={partner?.address.city ?? ""} />
                      <SelectField error={isPendingField("partner.address.state")} label="Estado" onChange={(value) => updatePartnerAddress("state", value)} options={REVENDEDOR_STATE_OPTIONS} value={partner?.address.state ?? ""} />
                    </div>
                  </>
                ) : null}

                {section === "bank" ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field error={isPendingField("bankAccount.holderName")} label="Titular" onChange={(value) => updateBank("holderName", value)} value={currentState.draft.bankAccount.holderName} />
                      <SelectField
                        label="Tipo do titular"
                        onChange={(value) => updateBank("holderType", value === "individual" ? "individual" : "company")}
                        options={[
                          { label: "Pessoa juridica", value: "company" },
                          { label: "Pessoa fisica", value: "individual" },
                        ]}
                        value={currentState.draft.bankAccount.holderType}
                      />
                      <Field
                        error={isPendingField("bankAccount.holderDocument")}
                        inputMode="numeric"
                        label={currentState.draft.bankAccount.holderType === "company" ? "CNPJ do titular" : "CPF do titular"}
                        onChange={(value) =>
                          updateBank(
                            "holderDocument",
                            currentState.draft.bankAccount.holderType === "company" ? formatCnpj(value) : formatCpf(value),
                          )
                        }
                        value={currentState.draft.bankAccount.holderDocument}
                      />
                      <SelectField
                        error={isPendingField("bankAccount.bankCode")}
                        label="Banco"
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
                        value={bankSelectValue}
                      />
                      {useCustomBankCode ? (
                        <Field
                          error={isPendingField("bankAccount.bankCode")}
                          inputMode="numeric"
                          label="Codigo do banco"
                          onChange={(value) => updateBank("bankCode", value.replace(/\D/g, "").slice(0, 3))}
                          value={currentState.draft.bankAccount.bankCode}
                        />
                      ) : null}
                      <Field error={isPendingField("bankAccount.branchNumber")} inputMode="numeric" label="Agencia" onChange={(value) => updateBank("branchNumber", value.replace(/\D/g, ""))} value={currentState.draft.bankAccount.branchNumber} />
                      <Field label="Digito agencia" onChange={(value) => updateBank("branchCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))} value={currentState.draft.bankAccount.branchCheckDigit} />
                      <Field error={isPendingField("bankAccount.accountNumber")} inputMode="numeric" label="Conta" onChange={(value) => updateBank("accountNumber", value.replace(/\D/g, ""))} value={currentState.draft.bankAccount.accountNumber} />
                      <Field error={isPendingField("bankAccount.accountCheckDigit")} label="Digito conta" onChange={(value) => updateBank("accountCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))} value={currentState.draft.bankAccount.accountCheckDigit} />
                      <SelectField
                        label="Tipo da conta"
                        onChange={(value) => updateBank("type", value === "savings" ? "savings" : "checking")}
                        options={[
                          { label: "Conta corrente", value: "checking" },
                          { label: "Conta poupanca", value: "savings" },
                        ]}
                        value={currentState.draft.bankAccount.type}
                      />
                    </div>
                  </>
                ) : null}
              </section>
            );
          })}

          {message ? (
            <div
              className={`rounded-[18px] border px-4 py-3 text-sm ${
                messageTone === "error"
                  ? "border-[#c0392b]/30 bg-[#c0392b]/8 text-[#8d2a1e]"
                  : "border-[#2f7d32]/25 bg-[#2f7d32]/8 text-[#245f27]"
              }`}
            >
              {message}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-brand-dark/10 bg-[#fbf7ef] px-5 py-4 md:px-7">
          <button
            className="rounded-full border border-brand-dark/14 px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-dark"
            onClick={() => setDismissed(true)}
            type="button"
          >
            Fechar
          </button>
          <button
            className="rounded-full bg-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-yellow disabled:opacity-50"
            disabled={saving}
            onClick={() => {
              void saveDraft();
            }}
            type="button"
          >
            {saving ? "Salvando..." : "Salvar pendencias"}
          </button>
        </div>
      </div>
    </div>
  );
}
