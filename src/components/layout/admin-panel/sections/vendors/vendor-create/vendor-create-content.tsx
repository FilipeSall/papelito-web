"use client";

import { Loader2, Plus, X } from "lucide-react";
import Link from "next/link";

import { VendorCoverageRangesField } from "@/components/shared/vendor-coverage-ranges-field";
import { BaseModal } from "@/components/ui/base-modal";
import {
  ADMIN_BANK_OPTIONS,
  OTHER_BANK_OPTION_VALUE,
} from "@/features/revendedor/constants/bank-codes";
import {
  REVENDEDOR_CORPORATION_TYPE_OPTIONS,
  REVENDEDOR_STATE_OPTIONS,
} from "@/features/revendedor/constants/revendedor-content";
import {
  formatCnpj,
  formatPhone,
} from "@/features/revendedor/utils/revendedor-formatters";
import { formatCpf } from "@/features/revendedor/utils/revendedor-registration";

import { AdminSelectField } from "../../products/components/admin-select-field";
import { getDocumentError, validateVendorCreateForm } from "./form";
import { Field, Section } from "./form-primitives";
import { useVendorCreateForm } from "./hooks/use-vendor-create-form";
import type { CepStatus, VendorCreateLauncherProps } from "./types";

function digits(value: string, max?: number) {
  const clean = value.replace(/\D/g, "");
  return typeof max === "number" ? clean.slice(0, max) : clean;
}

function getCepHelperText(isLookingUp: boolean, status: CepStatus | null) {
  if (isLookingUp) return "Buscando endereço pelo CEP...";
  return status?.tone === "info" ? status.message : undefined;
}

export function VendorCreateContent(props: VendorCreateLauncherProps) {
  const {
    bankSelectValue,
    branchHasCheckDigit,
    cepStatus,
    closeModal,
    createdVendor,
    error,
    form,
    handleManagingPartnerCepChange,
    handleStoreCepChange,
    handleSubmit,
    isCepLookingUp,
    isOpen,
    openNewForm,
    prefillSource,
    setUseCustomBankCode,
    submitting,
    update,
    updateBank,
    updateManagingPartnerAddressField,
    updateManagingPartnerField,
    updatePagarmeDraft,
    useCustomBankCode,
  } = useVendorCreateForm(props);

  const pendingRequirement = validateVendorCreateForm(form);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
            Operação
          </p>
          <h2 className="text-xl font-black uppercase tracking-tight text-[#1a1a1a]">Vendors</h2>
        </div>
        <button
          className="inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none"
          onClick={openNewForm}
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

      <BaseModal
        ariaLabelledBy="vendor-create-title"
        contentClassName="max-h-[calc(100vh-3rem)] max-w-5xl overflow-y-auto"
        onClose={closeModal}
        open={isOpen}
      >
          <form
            className="relative w-full max-w-5xl border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
            onSubmit={handleSubmit}
          >
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
                onClick={closeModal}
                type="button"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              {prefillSource ? (
                <div className="border-2 border-[#1a1a1a] bg-brand-yellow/40 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                  <p className="font-black uppercase tracking-[0.16em]">
                    Dados importados do usuário #{prefillSource.id}
                  </p>
                  <p className="mt-2 leading-6">
                    Nome, email, contato e endereço vieram da conta selecionada no painel de
                    usuários. Ajuste o que faltar antes de criar o vendor.
                  </p>
                </div>
              ) : null}

              <div className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm text-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]">
                <p className="font-black uppercase tracking-[0.16em]">Preenchimento mínimo do admin</p>
                <p className="mt-2 leading-6">
                  Os únicos blocos obrigatórios para o admin preencher agora são <strong>Conta</strong>, <strong>Dados comerciais</strong> e <strong>Endereço e cobertura</strong>. <strong>KYC da empresa</strong>, <strong>Responsável legal / socio administrador</strong> e <strong>Dados bancários</strong> podem ficar incompletos e depois serão exigidos do vendor.
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
                  {prefillSource ? (
                    <div className="border-2 border-dashed border-[#1a1a1a]/25 bg-white/60 px-3 py-2 text-xs leading-5 text-[#1a1a1a]/62">
                      A senha atual do customer será preservada. Nenhuma credencial nova será
                      gerada durante a promoção.
                    </div>
                  ) : (
                    <Field
                      autoComplete="new-password"
                      helpText="Informe uma senha temporária para o primeiro acesso do vendor. Essa senha deve ser comunicada ao vendor e alterada por ele após o login."
                      label="Senha temporária"
                      onChange={(value) => update("temporaryPassword", value)}
                      required
                      type="password"
                      value={form.temporaryPassword}
                    />
                  )}
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
                    error={getDocumentError(form.cnpj, "cnpj")}
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

              <Section title="Endereço e cobertura">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    inputMode="numeric"
                    label="CEP da loja"
                    helpText="Use o CEP para preencher logradouro, bairro, cidade e estado automaticamente."
                    helperText={getCepHelperText(isCepLookingUp, cepStatus)}
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
                    label="Número"
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
                    helpText="Nome com que a empresa está registrada na Receita Federal, exatamente como aparece no cartão CNPJ. É o nome usado em contrato e nota fiscal, e costuma ser diferente do nome fantasia."
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
                    label="Natureza jurídica"
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
                      label="Qual é a natureza jurídica?"
                      onChange={(value) => {
                        updatePagarmeDraft("corporationTypeOther", value);
                        updatePagarmeDraft("corporationType", value);
                      }}
                      value={form.pagarmeDraft.corporationTypeOther}
                    />
                  </div>
                ) : null}
              </Section>

              <Section title="Responsável legal / socio administrador">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Nome completo"
                    onChange={(value) => updateManagingPartnerField("name", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.name ?? ""}
                  />
                  <Field
                    helpText="Este e-mail é usado apenas no KYC do responsável legal e enviado à Pagar.me. Ele não cria uma conta nem permite entrar na Papelito; o login usa o e-mail da seção Conta."
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
                      { label: "Não", value: "nao" },
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
                    label="CEP do responsável"
                    onChange={(value) => {
                      void handleManagingPartnerCepChange(value);
                    }}
                    value={form.pagarmeDraft.managingPartners[0]?.address.zipCode ?? ""}
                  />
                  <Field
                    label="Rua do responsável"
                    onChange={(value) => updateManagingPartnerAddressField("street", value)}
                    value={form.pagarmeDraft.managingPartners[0]?.address.street ?? ""}
                  />
                  <Field
                    label="Número"
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
                    label="Estado do responsável"
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
                      { label: "Não", value: "no" },
                    ]}
                    placeholder="Selecione"
                    value={form.pagarmeDraft.hasManagingPartner}
                    variant="vendor-create"
                  />
                </div>
              </Section>

              <Section title="Dados bancários">
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
                      { label: "Pessoa jurídica", value: "company" },
                      { label: "Pessoa física", value: "individual" },
                    ]}
                    placeholder="Selecione"
                    value={form.bankAccount.holderType}
                    variant="vendor-create"
                  />
                  <Field
                    error={getDocumentError(
                      form.bankAccount.holderDocument,
                      form.bankAccount.holderType === "company" ? "cnpj" : "cpf",
                    )}
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
                    helpText="Selecione um banco da lista ou use Outro para informar manualmente o código de 3 digitos."
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
                      label="Código do banco"
                      onChange={(value) => updateBank("bankCode", digits(value, 3))}
                      placeholder="000"
                      value={form.bankAccount.bankCode}
                    />
                  ) : null}
                  <Field
                    inputMode="numeric"
                    label="Agência"
                    onChange={(value) => updateBank("branchNumber", digits(value))}
                    value={form.bankAccount.branchNumber}
                  />
                  <Field
                    disabled={!branchHasCheckDigit}
                    label="Digito agência"
                    placeholder={branchHasCheckDigit ? undefined : "Não se aplica"}
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

            <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-[#1a1a1a] bg-[#faf8f2] px-6 py-4">
              {pendingRequirement && !submitting ? (
                <p className="mr-auto text-[11px] font-semibold text-[#1a1a1a]/62">
                  Falta preencher: {pendingRequirement}
                </p>
              ) : null}
              <button
                className="inline-flex h-10 cursor-pointer items-center border-2 border-[#1a1a1a] bg-white px-4 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
                onClick={closeModal}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || pendingRequirement !== null}
                title={pendingRequirement ?? undefined}
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
      </BaseModal>
    </>
  );
}
