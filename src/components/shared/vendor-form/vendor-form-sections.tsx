"use client";

import type { ReactNode } from "react";

import { AdminSelectField } from "@/components/layout/admin-panel/sections/products/components/admin-select-field";
import { VendorCoverageRangesField } from "@/components/shared/vendor-coverage-ranges-field";
import {
  ADMIN_BANK_OPTIONS,
  OTHER_BANK_OPTION_VALUE,
} from "@/features/revendedor/constants/bank-codes";
import type { VendorPendingFieldKey } from "@/features/revendedor/constants/pending-registration";
import {
  REVENDEDOR_CORPORATION_TYPE_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
} from "@/features/revendedor/constants/revendedor-content";
import { formatCnpj, formatPhone } from "@/features/revendedor/utils/revendedor-formatters";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";
import type { VendorFormController } from "@/features/vendor-registration/hooks/use-vendor-form";
import type { VendorFormMode } from "@/features/vendor-registration/types";
import { digits, getDocumentError } from "@/features/vendor-registration/vendor-form-values";

import { Field, Section } from "./vendor-form-primitives";

const RAZAO_SOCIAL_HELP =
  "Nome com que a empresa está registrada na Receita Federal, exatamente como aparece no cartão CNPJ. É o nome usado em contrato e nota fiscal, e costuma ser diferente do nome fantasia.";
const PARTNER_EMAIL_HELP =
  "Este e-mail é usado apenas no KYC do responsável legal e enviado à Pagar.me. Ele não cria uma conta nem permite entrar na Papelito; o login usa o e-mail da seção Conta.";
const PHONE_HELP =
  "A Pagar.me exige um telefone com DDD no cadastro do recebedor e do responsável legal.";
const CEP_HELP = "Use o CEP para preencher logradouro, bairro, cidade e estado automaticamente.";
const MANUAL_ADJUST_HELP = "Pode ser ajustado manualmente se a busca vier incompleta.";
const BANK_HELP =
  "Selecione um banco da lista ou use Outro para informar manualmente o código de 3 digitos.";
const TEMPORARY_PASSWORD_HELP =
  "Informe uma senha temporária para o primeiro acesso do vendor. Essa senha deve ser comunicada ao vendor e alterada por ele após o login.";

export type VendorFormSectionsProps = Readonly<{
  accountNotice?: ReactNode;
  controller: VendorFormController;
  fieldError?: (field: VendorPendingFieldKey) => string | undefined;
  mode: VendorFormMode;
}>;

export function VendorFormSections({
  accountNotice,
  controller,
  fieldError,
  mode,
}: VendorFormSectionsProps) {
  const {
    bankSelectValue,
    branchHasCheckDigit,
    cepStatus,
    handleManagingPartnerCepChange,
    handleStoreCepChange,
    isCepLookingUp,
    partner,
    setUseCustomBankCode,
    update,
    updateBank,
    updateCoverageRanges,
    updateManagingPartnerAddressField,
    updateManagingPartnerField,
    updatePagarmeDraft,
    useCustomBankCode,
    values,
  } = controller;

  const errorFor = (field: VendorPendingFieldKey) => fieldError?.(field);
  const showTemporaryPassword = mode === "admin-create" && !values.sourceUserId;

  return (
    <>
      <Section title="Conta">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            autoComplete="email"
            inputMode="email"
            label="E-mail"
            onChange={(value) => update("email", value)}
            required
            type="email"
            value={values.email}
          />
          <Field
            label="Nome"
            onChange={(value) => update("firstName", value)}
            value={values.firstName}
          />
          <Field
            label="Sobrenome"
            onChange={(value) => update("lastName", value)}
            value={values.lastName}
          />
          {showTemporaryPassword ? (
            <Field
              autoComplete="new-password"
              helpText={TEMPORARY_PASSWORD_HELP}
              label="Senha temporária"
              onChange={(value) => update("temporaryPassword", value)}
              required
              type="password"
              value={values.temporaryPassword}
            />
          ) : null}
          {accountNotice}
        </div>
      </Section>

      <Section title="Dados comerciais">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Nome da loja"
            onChange={(value) => {
              update("storeName", value);
              if (!values.bankAccount.holderName.trim()) updateBank("holderName", value);
            }}
            required
            value={values.storeName}
          />
          <Field
            error={getDocumentError(values.cnpj, "cnpj")}
            inputMode="numeric"
            label="CNPJ"
            onChange={(value) => {
              const next = formatCnpj(value);
              const previous = values.cnpj;
              update("cnpj", next);
              if (
                values.bankAccount.holderType === "company" &&
                (!values.bankAccount.holderDocument ||
                  values.bankAccount.holderDocument === previous)
              ) {
                updateBank("holderDocument", next);
              }
            }}
            required
            value={values.cnpj}
          />
          <Field
            error={errorFor("phoneNumber")}
            helpText={PHONE_HELP}
            inputMode="tel"
            label="Telefone"
            onChange={(value) => update("phoneNumber", formatPhone(value))}
            required
            value={values.phoneNumber}
          />
        </div>
      </Section>

      <Section title="Endereço e cobertura">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            error={cepStatus?.tone === "error" ? cepStatus.message : undefined}
            helpText={CEP_HELP}
            helperText={
              isCepLookingUp
                ? "Buscando endereço pelo CEP..."
                : cepStatus?.tone === "info"
                  ? cepStatus.message
                  : undefined
            }
            inputMode="numeric"
            label="CEP da loja"
            onChange={(value) => {
              void handleStoreCepChange(value);
            }}
            value={values.cep}
          />
          <AdminSelectField
            helpText={MANUAL_ADJUST_HELP}
            label="Estado"
            onChange={(value) => update("state", value)}
            options={REVENDEDOR_STATE_OPTIONS}
            placeholder="Selecione"
            value={values.state}
            variant="vendor-create"
          />
          <Field
            helpText={MANUAL_ADJUST_HELP}
            label="Cidade"
            onChange={(value) => update("city", value)}
            value={values.city}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            helpText={MANUAL_ADJUST_HELP}
            label="Rua / Logradouro"
            onChange={(value) => update("street", value)}
            required
            value={values.street}
          />
          <Field
            helpText={MANUAL_ADJUST_HELP}
            label="Bairro"
            onChange={(value) => update("neighborhood", value)}
            required
            value={values.neighborhood}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="Número"
            onChange={(value) => update("number", value.replace(/[^\dA-Za-z-]/g, ""))}
            required
            value={values.number}
          />
          <Field
            label="Complemento"
            onChange={(value) => update("complement", value)}
            value={values.complement}
          />
        </div>

        <div className="mt-4">
          <VendorCoverageRangesField
            onChangeRanges={updateCoverageRanges}
            ranges={values.coverageRanges}
            required
            variant="vendor-create"
          />
        </div>
      </Section>

      <Section title="KYC da empresa">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            error={errorFor("companyName")}
            helpText={RAZAO_SOCIAL_HELP}
            label="Razao social"
            onChange={(value) => updatePagarmeDraft("companyName", value)}
            value={values.pagarmeDraft.companyName}
          />
          <Field
            error={errorFor("tradingName")}
            label="Nome fantasia"
            onChange={(value) => updatePagarmeDraft("tradingName", value)}
            value={values.pagarmeDraft.tradingName}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AdminSelectField
            label="Natureza jurídica (opcional)"
            onChange={(value) => {
              updatePagarmeDraft("corporationTypeSelection", value);
              updatePagarmeDraft(
                "corporationType",
                value === "outro" ? values.pagarmeDraft.corporationTypeOther : value,
              );
            }}
            options={REVENDEDOR_CORPORATION_TYPE_OPTIONS}
            placeholder="Selecione"
            value={values.pagarmeDraft.corporationTypeSelection}
            variant="vendor-create"
          />
          <Field
            label="Data de fundacao (opcional)"
            onChange={(value) => updatePagarmeDraft("foundingDate", value)}
            type="date"
            value={values.pagarmeDraft.foundingDate}
          />
          <Field
            error={errorFor("annualRevenue")}
            label="Faturamento anual"
            onChange={(value) => updatePagarmeDraft("annualRevenue", value)}
            type="number"
            value={values.pagarmeDraft.annualRevenue}
          />
        </div>

        {values.pagarmeDraft.corporationTypeSelection === "outro" ? (
          <div className="mt-4">
            <Field
              label="Qual é a natureza jurídica?"
              onChange={(value) => {
                updatePagarmeDraft("corporationTypeOther", value);
                updatePagarmeDraft("corporationType", value);
              }}
              value={values.pagarmeDraft.corporationTypeOther}
            />
          </div>
        ) : null}
      </Section>

      <Section title="Responsável legal / socio administrador">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            error={errorFor("partner.name")}
            label="Nome completo"
            onChange={(value) => updateManagingPartnerField("name", value)}
            value={partner.name}
          />
          <Field
            error={errorFor("partner.email")}
            helpText={PARTNER_EMAIL_HELP}
            label="E-mail"
            onChange={(value) => updateManagingPartnerField("email", value)}
            type="email"
            value={partner.email}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field
            error={errorFor("partner.document") ?? getDocumentError(partner.document, "cpf")}
            inputMode="numeric"
            label="CPF"
            onChange={(value) => updateManagingPartnerField("document", formatCpf(value))}
            value={partner.document}
          />
          <Field
            label="Nome da mae (opcional)"
            onChange={(value) => updateManagingPartnerField("motherName", value)}
            value={partner.motherName}
          />
          <Field
            error={errorFor("partner.birthdate")}
            label="Data de nascimento"
            onChange={(value) => updateManagingPartnerField("birthdate", value)}
            type="date"
            value={partner.birthdate}
          />
          <Field
            error={errorFor("partner.monthlyIncome")}
            label="Renda mensal"
            onChange={(value) => updateManagingPartnerField("monthlyIncome", value)}
            type="number"
            value={partner.monthlyIncome}
          />
          <Field
            error={errorFor("partner.professionalOccupation")}
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
              { label: "Não", value: "nao" },
            ]}
            placeholder="Selecione"
            value={partner.selfDeclaredLegalRepresentative === false ? "nao" : "sim"}
            variant="vendor-create"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field
            error={errorFor("partner.address.zipCode")}
            inputMode="numeric"
            label="CEP do responsável"
            onChange={(value) => {
              void handleManagingPartnerCepChange(value);
            }}
            value={partner.address.zipCode}
          />
          <Field
            error={errorFor("partner.address.street")}
            label="Rua do responsável"
            onChange={(value) => updateManagingPartnerAddressField("street", value)}
            value={partner.address.street}
          />
          <Field
            error={errorFor("partner.address.streetNumber")}
            label="Número"
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
            error={errorFor("partner.address.neighborhood")}
            label="Bairro"
            onChange={(value) => updateManagingPartnerAddressField("neighborhood", value)}
            value={partner.address.neighborhood}
          />
          <Field
            error={errorFor("partner.address.city")}
            label="Cidade"
            onChange={(value) => updateManagingPartnerAddressField("city", value)}
            value={partner.address.city}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminSelectField
            label="Estado do responsável"
            onChange={(value) => updateManagingPartnerAddressField("state", value)}
            options={REVENDEDOR_STATE_OPTIONS}
            placeholder="Selecione"
            value={partner.address.state}
            variant="vendor-create"
          />
          <AdminSelectField
            label="Tem socio administrador?"
            onChange={(value) =>
              updatePagarmeDraft("hasManagingPartner", value === "no" ? "no" : "yes")
            }
            options={[
              { label: "Sim", value: "yes" },
              { label: "Não", value: "no" },
            ]}
            placeholder="Selecione"
            value={values.pagarmeDraft.hasManagingPartner}
            variant="vendor-create"
          />
        </div>
      </Section>

      <Section title="Dados bancários">
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            error={errorFor("bankAccount.holderName")}
            label="Titular"
            onChange={(value) => updateBank("holderName", value)}
            value={values.bankAccount.holderName}
          />
          <AdminSelectField
            label="Tipo do titular"
            onChange={(value) => {
              const holderType = value === "individual" ? "individual" : "company";
              updateBank("holderType", holderType);
              updateBank("holderDocument", holderType === "company" ? values.cnpj : "");
            }}
            options={[
              { label: "Pessoa jurídica", value: "company" },
              { label: "Pessoa física", value: "individual" },
            ]}
            placeholder="Selecione"
            value={values.bankAccount.holderType}
            variant="vendor-create"
          />
          <Field
            error={
              errorFor("bankAccount.holderDocument") ??
              getDocumentError(
                values.bankAccount.holderDocument,
                values.bankAccount.holderType === "company" ? "cnpj" : "cpf",
              )
            }
            inputMode="numeric"
            label={
              values.bankAccount.holderType === "company" ? "CNPJ do titular" : "CPF do titular"
            }
            onChange={(value) =>
              updateBank(
                "holderDocument",
                values.bankAccount.holderType === "company" ? formatCnpj(value) : formatCpf(value),
              )
            }
            value={values.bankAccount.holderDocument}
          />
          <AdminSelectField
            helpText={BANK_HELP}
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
            placeholder="Selecione"
            value={bankSelectValue}
            variant="vendor-create"
          />
          {useCustomBankCode ? (
            <Field
              error={errorFor("bankAccount.bankCode")}
              inputMode="numeric"
              label="Código do banco"
              onChange={(value) => updateBank("bankCode", digits(value, 3))}
              placeholder="000"
              value={values.bankAccount.bankCode}
            />
          ) : null}
          <Field
            error={errorFor("bankAccount.branchNumber")}
            inputMode="numeric"
            label="Agência"
            onChange={(value) => updateBank("branchNumber", digits(value))}
            value={values.bankAccount.branchNumber}
          />
          <Field
            disabled={!branchHasCheckDigit}
            label="Digito agência"
            onChange={(value) =>
              updateBank("branchCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))
            }
            placeholder={branchHasCheckDigit ? undefined : "Não se aplica"}
            value={branchHasCheckDigit ? (values.bankAccount.branchCheckDigit ?? "") : ""}
          />
          <Field
            error={errorFor("bankAccount.accountNumber")}
            inputMode="numeric"
            label="Conta"
            onChange={(value) => updateBank("accountNumber", digits(value))}
            value={values.bankAccount.accountNumber}
          />
          <Field
            error={errorFor("bankAccount.accountCheckDigit")}
            label="Digito conta"
            onChange={(value) =>
              updateBank("accountCheckDigit", value.replace(/[^0-9A-Za-z]/g, "").slice(0, 2))
            }
            value={values.bankAccount.accountCheckDigit}
          />
          <AdminSelectField
            label="Tipo da conta"
            onChange={(value) => updateBank("type", value === "savings" ? "savings" : "checking")}
            options={[
              { label: "Conta corrente", value: "checking" },
              { label: "Conta poupanca", value: "savings" },
            ]}
            placeholder="Selecione"
            value={values.bankAccount.type}
            variant="vendor-create"
          />
        </div>
      </Section>
    </>
  );
}
