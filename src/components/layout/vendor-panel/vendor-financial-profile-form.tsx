"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { hardPrimaryActionClass } from "@/components/ui/hard-actions";
import { Field } from "@/components/shared/vendor-form/vendor-form-primitives";
import { patchVendorFinancialProfile } from "@/features/vendor-payment-gateways/services/payment-gateways-client";
import type { FinancialProfile, GatewayPending } from "@/features/vendor-payment-gateways/types/payment-gateways";
import {
  buildFinancialProfilePatch,
  createFinancialFormValues,
  validateFinancialForm,
  type FinancialFormErrors,
  type FinancialFormValues,
} from "@/features/vendor-payment-gateways/utils/financial-profile-form";
import { pendingFieldLabel } from "@/features/vendor-payment-gateways/utils/gateway-display";
import { gatewayStateLabel } from "@/features/vendor-payment-gateways/utils/payment-gateway-messages";

import {
  BankAccountFields,
  CompanyFields,
  PagarmeComplementFields,
  PagarmeUnavailableNotice,
  RepresentativeFields,
  type FinancialFormUpdate,
} from "./financial-profile-sections";
import { PaymentNotice, type PaymentNoticeState } from "./payment-notice";
import { FINANCIAL_PROFILE_ANCHOR } from "./vendor-payment-gateways-panel";

const REAUTH_FAILED_CODE = "papelito_reauthentication_failed";
const PASSWORD_REQUIRED = "Digite a senha atual para salvar conta bancária, CPF ou nascimento.";
const BLOCKED_CNAE_TITLE = gatewayStateLabel("blocked_cnae");

type VendorFinancialProfileFormProps = {
  /** Perfil lido no servidor; `null` quando a leitura falhou. */
  initialProfile: FinancialProfile | null;
  /** CNPJ cadastrado da loja, documento obrigatório da conta PJ. */
  cnpj: string;
};

function PagarmePendingLine({ pending }: Readonly<{ pending: GatewayPending }>) {
  if (pending.policy === "blocked_cnae") return <>{BLOCKED_CNAE_TITLE}.</>;
  if (pending.pendingFields.length === 0) return <>nenhum dado pendente neste formulário.</>;

  return <>falta {[...new Set(pending.pendingFields.map(pendingFieldLabel))].join(", ")}.</>;
}

function MercadoPagoPendingLine({ pending }: Readonly<{ pending: GatewayPending }>) {
  if (pending.pendingFields.length === 0) return <>nenhum dado deste formulário é exigido; conecte a conta no card acima.</>;

  return <>falta {[...new Set(pending.pendingFields.map(pendingFieldLabel))].join(", ")}.</>;
}

function FinancialPendingSummary({ profile }: Readonly<{ profile: FinancialProfile }>) {
  return (
    <ul className="space-y-1 border-2 border-dashed border-[#1a1a1a]/40 bg-white px-4 py-3 text-[13px] leading-5 font-medium text-[#1a1a1a]/80">
      <li data-testid="financial-pending-pagarme">
        <span className="font-black text-[#1a1a1a]">Pagar.me:</span> <PagarmePendingLine pending={profile.pending.pagarme} />
      </li>
      <li data-testid="financial-pending-mercadopago">
        <span className="font-black text-[#1a1a1a]">Mercado Pago:</span>{" "}
        <MercadoPagoPendingLine pending={profile.pending.mercadopago} />
      </li>
    </ul>
  );
}

function FinancialFormIntro() {
  return (
    <div className="space-y-2">
      <h3
        className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
        style={{ fontFamily: "var(--font-admin-display)" }}
      >
        <span aria-hidden="true" className="inline-block size-3 rotate-45 bg-brand-yellow" />
        Dados financeiros
      </h3>
      <p className="max-w-3xl text-[13px] leading-5 font-medium text-[#1a1a1a]/70">
        Completar estes dados prepara o cadastro da loja na Pagar.me. O Mercado Pago não usa este formulário: a conta dele é
        conferida pela conexão no card acima, e cada gateway pode pedir verificações próprias.
      </p>
    </div>
  );
}

type PasswordFieldProps = {
  error?: string;
  value: string;
  onChange: (value: string) => void;
};

function SensitivePasswordField({ error, onChange, value }: Readonly<PasswordFieldProps>) {
  return (
    <div className="max-w-sm">
      <Field
        autoComplete="current-password"
        error={error}
        helperText="Alterar conta bancária, CPF ou nascimento exige a senha atual."
        label="Senha atual da sua conta Papelito"
        onChange={onChange}
        type="password"
        value={value}
      />
    </div>
  );
}

type PagarmeSectionsProps = {
  blocked: boolean;
  cnpj: string;
  errors: FinancialFormErrors;
  pending: ReadonlySet<string>;
  profile: FinancialProfile;
  update: FinancialFormUpdate;
  values: FinancialFormValues;
};

function PagarmeSections({ blocked, cnpj, errors, pending, profile, update, values }: Readonly<PagarmeSectionsProps>) {
  if (blocked) return <PagarmeUnavailableNotice />;

  const [savedPartner] = profile.profile.managingPartners;
  const shared = { errors, pending, update, values };

  return (
    <>
      <PagarmeComplementFields {...shared} savedPartner={savedPartner} />
      <BankAccountFields {...shared} cnpj={cnpj} />
    </>
  );
}

type FinancialProfileEditorProps = {
  cnpj: string;
  initialProfile: FinancialProfile;
};

function FinancialProfileEditor({ cnpj, initialProfile }: Readonly<FinancialProfileEditorProps>) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [initial, setInitial] = useState(() => createFinancialFormValues(initialProfile));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FinancialFormErrors>({});
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [notice, setNotice] = useState<PaymentNoticeState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const blocked = profile.pending.pagarme.policy === "blocked_cnae";
  const context = { cnpj, pagarmeBlocked: blocked };
  const patch = buildFinancialProfilePatch(initial, values, context);
  const pending = new Set(profile.pending.pagarme.pendingFields);

  const update: FinancialFormUpdate = (change) => {
    setValues((current) => {
      const next = structuredClone(current);
      change(next);
      return next;
    });
  };

  function applySaved(saved: FinancialProfile) {
    const next = createFinancialFormValues(saved);
    setProfile(saved);
    setInitial(next);
    setValues(next);
    setPassword("");
    setNotice({ tone: "success", message: "Dados financeiros salvos." });
    router.refresh();
  }

  function readyToSend(): boolean {
    const found = validateFinancialForm(initial, values, context);
    setErrors(found);
    setPasswordError(undefined);

    if (Object.keys(found).length > 0) {
      setNotice({ tone: "error", message: "Revise os campos destacados antes de salvar." });
      return false;
    }
    if (patch.empty) {
      setNotice({ tone: "info", message: "Nada mudou desde a última gravação." });
      return false;
    }
    if (patch.sensitive && !password) {
      setPasswordError(PASSWORD_REQUIRED);
      return false;
    }

    return true;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setNotice(null);
    if (!readyToSend()) return;

    setSubmitting(true);
    const result = await patchVendorFinancialProfile(profile.version, patch.profile, patch.sensitive ? password : undefined);
    setSubmitting(false);

    if (result.ok) {
      applySaved(result.data);
      return;
    }
    if (result.code === REAUTH_FAILED_CODE) {
      setPasswordError(result.message);
      return;
    }

    setNotice({ tone: "error", message: result.message });
  }

  return (
    <form className="space-y-6 border-t-2 border-[#1a1a1a] pt-6" id={FINANCIAL_PROFILE_ANCHOR} noValidate onSubmit={(event) => void submit(event)}>
      <FinancialFormIntro />
      <FinancialPendingSummary profile={profile} />
      <CompanyFields errors={errors} pending={pending} update={update} values={values} />
      <RepresentativeFields errors={errors} pending={pending} update={update} values={values} />
      <PagarmeSections
        blocked={blocked}
        cnpj={cnpj}
        errors={errors}
        pending={pending}
        profile={profile}
        update={update}
        values={values}
      />
      {patch.sensitive ? <SensitivePasswordField error={passwordError} onChange={setPassword} value={password} /> : null}
      <PaymentNotice notice={notice} />
      <div className="flex justify-end">
        <button aria-busy={submitting} className={hardPrimaryActionClass} disabled={submitting} type="submit">
          {submitting ? "Salvando..." : "Salvar dados financeiros"}
        </button>
      </div>
    </form>
  );
}

/**
 * Formulário financeiro unificado do modo de gateways (MP-013). Envia só o que mudou, com a
 * `version` lida; CPF e nascimento são write-only, e conta, CPF ou nascimento pedem a senha atual.
 * Com CNAE bloqueado, os blocos exclusivos da Pagar.me somem e deixam de ser exigidos. Sem
 * leitura do perfil, não desenha campos vazios que pareceriam salvos.
 */
export function VendorFinancialProfileForm({ cnpj, initialProfile }: Readonly<VendorFinancialProfileFormProps>) {
  if (!initialProfile) {
    return (
      <div className="space-y-4" id={FINANCIAL_PROFILE_ANCHOR}>
        <FinancialFormIntro />
        <PaymentNotice
          notice={{ tone: "error", message: "Não conseguimos ler os dados financeiros agora. Recarregue a página para editar." }}
        />
      </div>
    );
  }

  return <FinancialProfileEditor cnpj={cnpj} initialProfile={initialProfile} />;
}
