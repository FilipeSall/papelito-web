"use client";

import { useState } from "react";

import { AdminSelectField } from "@/components/layout/admin-panel/sections/products/components/admin-select-field";
import { Field, Section } from "@/components/shared/vendor-form/vendor-form-primitives";
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
import { formatCep, formatCnpj } from "@/features/revendedor/utils/revendedor-formatters";
import { BANK_HOLDER_NAME_MAX_LENGTH, formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import type { FinancialProfilePartner } from "@/features/vendor-payment-gateways/types/payment-gateways";
import type {
  FinancialFormErrors,
  FinancialFormValues,
} from "@/features/vendor-payment-gateways/utils/financial-profile-form";
import { gatewayStateLabel } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

/** Aplica uma alteração sobre uma cópia do estado do formulário financeiro. */
export type FinancialFormUpdate = (change: (draft: FinancialFormValues) => void) => void;

type SectionProps = {
  values: FinancialFormValues;
  errors: FinancialFormErrors;
  /** Pendências da Pagar.me vindas do backend; marcam o campo como obrigatório. */
  pending: ReadonlySet<string>;
  update: FinancialFormUpdate;
};

const CORPORATION_TYPE_OPTIONS = REVENDEDOR_CORPORATION_TYPE_OPTIONS.filter((option) => option.value !== "outro");
const ACCOUNT_TYPE_OPTIONS = [
  { label: "Conta corrente", value: "checking" },
  { label: "Conta poupança", value: "savings" },
];
const BLOCKED_CNAE_TITLE = gatewayStateLabel("blocked_cnae");

function digitsOnly(value: string, max?: number): string {
  const clean = value.replace(/\D/g, "");
  return typeof max === "number" ? clean.slice(0, max) : clean;
}

function checkDigit(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2);
}

function corporationOptions(current: string) {
  if (!current || CORPORATION_TYPE_OPTIONS.some((option) => option.value === current)) return CORPORATION_TYPE_OPTIONS;

  return [...CORPORATION_TYPE_OPTIONS, { label: current, value: current }];
}

/** Razão social, nome fantasia, natureza e fundação: comuns aos dois gateways. */
export function CompanyFields({ errors, pending, update, values }: Readonly<SectionProps>) {
  return (
    <Section title="Empresa">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          error={errors.companyName}
          label="Razão social"
          onChange={(value) => update((draft) => { draft.companyName = value; })}
          required={pending.has("companyName")}
          value={values.companyName}
        />
        <Field
          error={errors.tradingName}
          label="Nome fantasia"
          onChange={(value) => update((draft) => { draft.tradingName = value; })}
          required={pending.has("tradingName")}
          value={values.tradingName}
        />
        <AdminSelectField
          label="Natureza jurídica"
          onChange={(value) => update((draft) => { draft.corporationType = value; })}
          options={corporationOptions(values.corporationType)}
          placeholder="Selecione"
          value={values.corporationType}
          variant="vendor-create"
        />
        <Field
          label="Data de fundação (opcional)"
          onChange={(value) => update((draft) => { draft.foundingDate = value; })}
          type="date"
          value={values.foundingDate}
        />
      </div>
    </Section>
  );
}

/** Nome, e-mail e autodeclaração do representante legal: comuns aos dois gateways. */
export function RepresentativeFields({ errors, pending, update, values }: Readonly<SectionProps>) {
  return (
    <Section title="Representante legal">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          error={errors["partner.name"]}
          label="Nome completo"
          onChange={(value) => update((draft) => { draft.partner.name = value; })}
          required={pending.has("partner.name")}
          value={values.partner.name}
        />
        <Field
          error={errors["partner.email"]}
          inputMode="email"
          label="E-mail do representante"
          onChange={(value) => update((draft) => { draft.partner.email = value; })}
          required={pending.has("partner.email")}
          type="email"
          value={values.partner.email}
        />
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm font-medium text-[#1a1a1a]">
        <input
          checked={values.partner.selfDeclaredLegalRepresentative}
          className="mt-0.5 size-4 accent-[#1a1a1a]"
          onChange={(event) => {
            const checked = event.target.checked;
            update((draft) => { draft.partner.selfDeclaredLegalRepresentative = checked; });
          }}
          type="checkbox"
        />
        Confirmo que esta pessoa é representante legal da empresa.
      </label>
    </Section>
  );
}

type PagarmeComplementProps = SectionProps & {
  /** Indicadores de CPF e nascimento já salvos; o valor em claro nunca chega aqui. */
  savedPartner: Pick<FinancialProfilePartner, "documentLast4" | "hasBirthdate" | "hasDocument">;
};

function cpfPlaceholder(savedPartner: PagarmeComplementProps["savedPartner"]): string {
  if (!savedPartner.hasDocument) return "000.000.000-00";

  return savedPartner.documentLast4 ? `CPF salvo terminando em ${savedPartner.documentLast4}` : "CPF já salvo";
}

function PartnerAddressFields({ errors, pending, update, values }: Readonly<SectionProps>) {
  const address = values.partner.address;

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-3">
      <Field
        error={errors["partner.address.zipCode"]}
        inputMode="numeric"
        label="CEP do representante"
        onChange={(value) => update((draft) => { draft.partner.address.zipCode = formatCep(value); })}
        required={pending.has("partner.address.zipCode")}
        value={formatCep(address.zipCode)}
      />
      <Field
        label="Rua"
        onChange={(value) => update((draft) => { draft.partner.address.street = value; })}
        required={pending.has("partner.address.street")}
        value={address.street}
      />
      <Field
        label="Número"
        onChange={(value) => update((draft) => { draft.partner.address.streetNumber = value.replace(/[^\dA-Za-z-]/g, ""); })}
        required={pending.has("partner.address.streetNumber")}
        value={address.streetNumber}
      />
      <Field
        label="Complemento"
        onChange={(value) => update((draft) => { draft.partner.address.complement = value; })}
        value={address.complement}
      />
      <Field
        label="Bairro"
        onChange={(value) => update((draft) => { draft.partner.address.neighborhood = value; })}
        required={pending.has("partner.address.neighborhood")}
        value={address.neighborhood}
      />
      <Field
        label="Cidade"
        onChange={(value) => update((draft) => { draft.partner.address.city = value; })}
        required={pending.has("partner.address.city")}
        value={address.city}
      />
      <AdminSelectField
        label="Estado"
        onChange={(value) => update((draft) => { draft.partner.address.state = value; })}
        options={REVENDEDOR_STATE_OPTIONS}
        placeholder="Selecione"
        value={address.state}
        variant="vendor-create"
      />
    </div>
  );
}

/**
 * Dados que só a Pagar.me usa: faturamento e o KYC do representante (CPF, nascimento, renda,
 * ocupação e endereço). CPF e nascimento são write-only — começam vazios e só seguem quando o
 * vendor digita um valor novo.
 */
export function PagarmeComplementFields(props: Readonly<PagarmeComplementProps>) {
  const { errors, pending, savedPartner, update, values } = props;

  return (
    <Section title="Complemento para a Pagar.me">
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          error={errors["partner.document"]}
          inputMode="numeric"
          label="CPF"
          onChange={(value) => update((draft) => { draft.partner.document = formatCpf(value); })}
          placeholder={cpfPlaceholder(savedPartner)}
          required={pending.has("partner.document")}
          value={values.partner.document}
        />
        <Field
          error={errors["partner.birthdate"]}
          helperText={savedPartner.hasBirthdate ? "Já salva. Preencha só para trocar." : undefined}
          label="Data de nascimento"
          onChange={(value) => update((draft) => { draft.partner.birthdate = value; })}
          required={pending.has("partner.birthdate")}
          type="date"
          value={values.partner.birthdate}
        />
        <Field
          label="Nome da mãe (opcional)"
          onChange={(value) => update((draft) => { draft.partner.motherName = value; })}
          value={values.partner.motherName}
        />
        <Field
          inputMode="decimal"
          label="Renda mensal"
          onChange={(value) => update((draft) => { draft.partner.monthlyIncome = value; })}
          required={pending.has("partner.monthlyIncome")}
          type="number"
          value={values.partner.monthlyIncome}
        />
        <Field
          label="Ocupação profissional"
          onChange={(value) => update((draft) => { draft.partner.professionalOccupation = value; })}
          required={pending.has("partner.professionalOccupation")}
          value={values.partner.professionalOccupation}
        />
        <Field
          inputMode="decimal"
          label="Faturamento anual da empresa"
          onChange={(value) => update((draft) => { draft.annualRevenue = value; })}
          required={pending.has("annualRevenue")}
          type="number"
          value={values.annualRevenue}
        />
      </div>
      <PartnerAddressFields {...props} />
    </Section>
  );
}

type BankAccountFieldsProps = SectionProps & {
  /** CNPJ da loja: a conta precisa ser PJ e estar neste documento. */
  cnpj: string;
};

function BankCodeFields({ errors, update, values }: Readonly<Pick<SectionProps, "errors" | "update" | "values">>) {
  const bankCode = values.bankAccount.bankCode.trim();
  const [custom, setCustom] = useState(() => bankCode !== "" && !findBankOptionByCode(bankCode));
  const selectValue = custom ? OTHER_BANK_OPTION_VALUE : (findBankOptionByCode(bankCode)?.value ?? "");

  function selectBank(value: string) {
    const isOther = value === OTHER_BANK_OPTION_VALUE;
    setCustom(isOther);
    update((draft) => {
      draft.bankAccount.bankCode = isOther ? "" : value;
      if (!bankHasBranchCheckDigit(draft.bankAccount.bankCode)) draft.bankAccount.branchCheckDigit = "";
    });
  }

  return (
    <>
      <AdminSelectField
        label="Banco"
        onChange={selectBank}
        options={ADMIN_BANK_OPTIONS}
        placeholder="Selecione"
        value={selectValue}
        variant="vendor-create"
      />
      {custom ? (
        <Field
          error={errors["bankAccount.bankCode"]}
          inputMode="numeric"
          label="Código do banco"
          onChange={(value) => update((draft) => { draft.bankAccount.bankCode = digitsOnly(value, 3); })}
          placeholder="000"
          value={values.bankAccount.bankCode}
        />
      ) : null}
    </>
  );
}

/** Conta PJ da loja: titular é sempre a empresa e o documento é sempre o CNPJ cadastrado. */
export function BankAccountFields({ cnpj, errors, pending, update, values }: Readonly<BankAccountFieldsProps>) {
  const bank = values.bankAccount;
  const branchHasCheckDigit = bankHasBranchCheckDigit(bank.bankCode);

  return (
    <Section title="Conta PJ">
      <p className="-mt-2 mb-4 max-w-3xl text-[13px] leading-5 font-medium text-[#1a1a1a]/70">
        A Pagar.me só aceita conta aberta no CNPJ da empresa. MEI também pode abrir conta PJ.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          error={errors["bankAccount.holderName"]}
          label="Titular"
          maxLength={BANK_HOLDER_NAME_MAX_LENGTH}
          onChange={(value) => update((draft) => { draft.bankAccount.holderName = value; })}
          required={pending.has("bankAccount.holderName")}
          value={bank.holderName}
        />
        <Field disabled label="Tipo do titular" onChange={() => undefined} value="Pessoa jurídica" />
        <Field
          disabled
          error={errors["bankAccount.holderDocument"]}
          label="CNPJ do titular"
          onChange={() => undefined}
          value={formatCnpj(cnpj)}
        />
        <BankCodeFields errors={errors} update={update} values={values} />
        <Field
          error={errors["bankAccount.branchNumber"]}
          inputMode="numeric"
          label="Agência"
          onChange={(value) => update((draft) => { draft.bankAccount.branchNumber = digitsOnly(value); })}
          required={pending.has("bankAccount.branchNumber")}
          value={bank.branchNumber}
        />
        <Field
          disabled={!branchHasCheckDigit}
          label="Dígito da agência"
          onChange={(value) => update((draft) => { draft.bankAccount.branchCheckDigit = checkDigit(value); })}
          placeholder={branchHasCheckDigit ? undefined : "Não se aplica"}
          value={branchHasCheckDigit ? bank.branchCheckDigit : ""}
        />
        <Field
          error={errors["bankAccount.accountNumber"]}
          inputMode="numeric"
          label="Conta"
          onChange={(value) => update((draft) => { draft.bankAccount.accountNumber = digitsOnly(value); })}
          required={pending.has("bankAccount.accountNumber")}
          value={bank.accountNumber}
        />
        <Field
          error={errors["bankAccount.accountCheckDigit"]}
          label="Dígito da conta"
          onChange={(value) => update((draft) => { draft.bankAccount.accountCheckDigit = checkDigit(value); })}
          required={pending.has("bankAccount.accountCheckDigit")}
          value={bank.accountCheckDigit}
        />
        <AdminSelectField
          label="Tipo da conta"
          onChange={(value) => update((draft) => { draft.bankAccount.type = value === "savings" ? "savings" : "checking"; })}
          options={ACCOUNT_TYPE_OPTIONS}
          placeholder="Selecione"
          value={bank.type}
          variant="vendor-create"
        />
      </div>
    </Section>
  );
}

/** Substitui os blocos da Pagar.me quando o CNAE da empresa a bloqueia. */
export function PagarmeUnavailableNotice() {
  return (
    <Section title="Pagar.me">
      <div className="border-2 border-[#c0392b] bg-[#f7e6e2] px-4 py-3 text-[#7a3428]">
        <p className="text-sm font-black">{BLOCKED_CNAE_TITLE}</p>
        <p className="mt-1 text-[13px] leading-5 font-medium">
          O complemento para a Pagar.me e a conta PJ só servem a ela, e não são exigidos para vender pelo Mercado Pago.
        </p>
      </div>
    </Section>
  );
}
