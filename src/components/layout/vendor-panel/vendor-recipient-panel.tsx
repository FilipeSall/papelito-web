"use client";

import { ArrowRight, Check, CircleHelp, Clock, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BANK_HOLDER_NAME_MAX_LENGTH } from "@/features/revendedor/utils/revendedor-registration";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import type {
  VendorRecipient,
  VendorRecipientRejectedField,
} from "@/features/vendor-recipient/types/vendor-recipient";
import { mapRejectedFields } from "@/features/vendor-recipient/utils/rejected-fields";
import { createPagarmeBankAccountSupportThread } from "@/features/chamados/services/chamado-client";

import { AnchoredSection } from "@/components/ui/anchored-sections";

import type { FeedbackState } from "./feedback-banner";
import { RecipientRejectedFields } from "./recipient-rejected-fields";

const STATUS_LABELS: Record<string, string> = {
  registration: "Cadastro em andamento",
  affiliation: "KYC pendente",
  active: "Ativo",
  refused: "Recusado",
  suspended: "Suspenso",
  blocked: "Bloqueado",
  inactive: "Inativo",
};

const EDIT_FINANCIAL_DATA_HREF = buildVendorOnboardingHref("/vendor/configuracoes");
const SUPPORT_HREF = "/vendor/solicitacoes";
const recipientDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

type VerdictTone = "apto" | "andamento" | "impedido" | "ilegivel";

type RecipientAction =
  | { href: string; label: string; type: "href" }
  | { label: string; type: "kyc" };

type RecipientVerdict = {
  detail: string;
  headline: string;
  primaryAction: RecipientAction | null;
  primarySync: { label: string } | null;
  tone: VerdictTone;
};

function formatStatus(value: string) {
  return STATUS_LABELS[value] || "Não iniciado";
}

export function formatRecipientSyncAt(value: string) {
  if (!value) return "";

  const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? value : recipientDateFormatter.format(date);
}

export function buildRecipientVerdict(recipient: VendorRecipient): RecipientVerdict {
  if (recipient.loadFailed) {
    return {
      detail:
        "A Papelito não conseguiu consultar a Pagar.me agora, então este painel não sabe dizer se sua loja pode vender.",
      headline: "Estado do recebedor indisponível",
      primaryAction: null,
      primarySync: { label: "Tentar de novo" },
      tone: "ilegivel",
    };
  }

  if (recipient.status === "active") {
    return {
      detail: "O recebedor da sua loja está ativo na Pagar.me.",
      headline: "Sua loja pode receber pagamentos",
      primaryAction: null,
      primarySync: null,
      tone: "apto",
    };
  }

  const blocked = {
    headline: "Sua loja não pode receber pagamentos",
    tone: "impedido" as const,
  };
  const inProgress = {
    headline: "Sua loja ainda não pode receber pagamentos",
    tone: "andamento" as const,
  };

  if (!recipient.recipientId && !recipient.status) {
    return {
      ...inProgress,
      detail: "O recebedor da sua loja ainda não foi criado na Pagar.me.",
      primaryAction: { href: EDIT_FINANCIAL_DATA_HREF, label: "Preencher dados financeiros", type: "href" },
      primarySync: null,
    };
  }

  switch (recipient.status) {
    case "registration":
      return {
        ...inProgress,
        detail: "A Pagar.me está analisando o cadastro inicial do recebedor. Ainda não há uma ação de verificação disponível.",
        primaryAction: null,
        primarySync: { label: "Atualizar situação" },
      };
    case "affiliation":
      if (
        recipient.kycStatus === "partially_denied" &&
        recipient.kycStatusReason === "additional_documents_required"
      ) {
        return {
          ...inProgress,
          detail:
            "A Pagar.me solicitou a verificação do responsável legal. Você receberá o link por e-mail e seguirá agora para a prova de vida.",
          primaryAction: { label: "Concluir verificação no Pagar.me", type: "kyc" },
          primarySync: null,
        };
      }

      if (recipient.kycStatus === "pending") {
        return {
          ...inProgress,
          detail: "A Pagar.me recebeu sua documentação e a verificação está em análise.",
          primaryAction: null,
          primarySync: { label: "Atualizar situação" },
        };
      }

      return {
        ...blocked,
        detail:
          "A Pagar.me devolveu uma pendência de credenciamento que a Papelito ainda não reconhece. Fale com o suporte antes de tentar vender.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito", type: "href" },
        primarySync: null,
      };
    case "refused":
      return {
        ...blocked,
        detail: "A Pagar.me recusou o cadastro do recebedor da sua loja.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito", type: "href" },
        primarySync: null,
      };
    case "suspended":
      return {
        ...blocked,
        detail: "O recebedor da sua loja está suspenso na Pagar.me.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito", type: "href" },
        primarySync: null,
      };
    case "blocked":
      return {
        ...blocked,
        detail: "O recebedor da sua loja está bloqueado na Pagar.me.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito", type: "href" },
        primarySync: null,
      };
    case "inactive":
      return {
        ...blocked,
        detail: "O recebedor da sua loja está inativo na Pagar.me.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito", type: "href" },
        primarySync: null,
      };
    default:
      return {
        ...inProgress,
        detail: `A Pagar.me devolveu um estado que este painel ainda não conhece (${recipient.status}). Fale com a Papelito antes de contar com esta loja para vender.`,
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito", type: "href" },
        primarySync: null,
      };
  }
}

export function buildRecipientErrorFeedback(body: {
  code?: string;
  message?: string;
}): FeedbackState {
  switch (body.code) {
    case "papelito_pagarme_missing_partner":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Preencher responsável legal",
        error: true,
        hint: "Cadastre ao menos um responsável legal ou socio administrador e tente sincronizar novamente.",
        message: "A Pagar.me exige uma pessoa física responsável pela empresa para concluir o onboarding do recebedor.",
        title: "Responsável legal pendente",
      };
    case "papelito_pagarme_missing_address":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar dados financeiros",
        error: true,
        hint: "Confira o endereço comercial e o endereço do responsável legal antes de sincronizar novamente.",
        message: "Faltam dados de endereço obrigatórios para criar ou atualizar o recebedor.",
        title: "Endereço incompleto",
      };
    case "papelito_pagarme_missing_document":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar cadastro financeiro",
        error: true,
        hint: "O recebedor precisa de um CNPJ válido e coerente com os dados da empresa.",
        message: "Não foi possível sincronizar porque a documentacao da empresa esta incompleta.",
        title: "Documento da empresa pendente",
      };
    case "papelito_pagarme_missing_draft":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Preencher dados financeiros",
        error: true,
        hint: "Abra o formulário financeiro, complete KYC e conta bancária e depois tente sincronizar novamente.",
        message: "Os dados financeiros do recebedor ainda não foram preenchidos.",
        title: "Dados financeiros pendentes",
      };
    case "papelito_pagarme_invalid_company_name":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar razao social",
        error: true,
        hint: "Informe a razao social completa da empresa (mínimo de 5 caracteres).",
        message: "A razao social informada e muito curta para a Pagar.me.",
        title: "Razao social inválida",
      };
    case "papelito_pagarme_invalid_phone":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar telefone",
        error: true,
        hint: "Informe DDD e número, apenas dígitos — por exemplo, 61999998888.",
        message: "A Pagar.me exige um telefone com DDD para criar o recebedor da sua loja.",
        title: "Telefone inválido",
      };
    case "papelito_pagarme_missing_recipient":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Preencher dados financeiros",
        error: true,
        hint: "Preencha os dados financeiros para a Papelito criar o recebedor e tente de novo.",
        message: "Sua loja ainda não tem recebedor criado na Pagar.me, então não há o que sincronizar.",
        title: "Recebedor ainda não criado",
      };
    case "papelito_pagarme_network_error":
      return {
        error: true,
        hint: "Nenhum dado seu foi perdido. Tente sincronizar de novo em alguns minutos.",
        message: "A Papelito não conseguiu falar com a Pagar.me agora. O problema é de comunicação, não do seu cadastro.",
        title: "Pagar.me fora de alcance",
      };
    case "papelito_pagarme_not_configured":
    case "papelito_pagarme_environment_mismatch":
      return {
        actionHref: SUPPORT_HREF,
        actionLabel: "Avisar a Papelito",
        error: true,
        hint: "Não há nada a corrigir no seu cadastro. Abra uma solicitação para a Papelito resolver.",
        message: "A integração da Papelito com a Pagar.me está indisponível neste ambiente.",
        title: "Integração indisponível",
      };
    case "papelito_pagarme_bank_account_update_auth_required":
      return {
        actionType: "pagarme-bank-account-support",
        actionLabel: "Falar com o suporte da Papelito",
        error: true,
        hint: "A conta anterior permanece ativa até a Papelito concluir a autorização necessária.",
        message: "A Pagar.me exige uma autorização adicional para trocar a conta bancária cadastrada.",
        title: "Atualização bancária requer autorização",
      };
    case "papelito_pagarme_kyc_not_required":
      return {
        error: true,
        hint: "Atualize a situação antes de tentar novamente. A Pagar.me só libera o link quando solicita essa etapa.",
        message: "A verificação ainda não está disponível para este recebedor.",
        title: "Aguardando solicitação da Pagar.me",
      };
    case "papelito_pagarme_kyc_link_rate_limited":
      return {
        error: true,
        hint: "O último link enviado continua válido por 20 minutos. Aguarde antes de pedir outro.",
        message: "Você pediu links de verificação recentemente.",
        title: "Aguarde para gerar outro link",
      };
    case "papelito_pagarme_bank_holder_mismatch":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Trocar conta bancária",
        error: true,
        hint: "A Pagar.me só aceita conta bancária no mesmo CNPJ do recebedor. Informe uma conta PJ aberta no CNPJ da empresa; MEI também pode abrir conta PJ.",
        message: "A conta bancária cadastrada não está no CNPJ da empresa.",
        title: "Conta bancária fora do CNPJ da empresa",
      };
    case "papelito_pagarme_invalid_holder_name":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar titular da conta",
        error: true,
        hint: `Abrevie a razão social como ela aparece no banco, com até ${BANK_HOLDER_NAME_MAX_LENGTH} caracteres, e sincronize de novo.`,
        message: "O nome do titular da conta é maior do que a Pagar.me aceita.",
        title: "Nome do titular longo demais",
      };
    case "papelito_pagarme_request_failed":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar dados enviados",
        error: true,
        hint: "A Pagar.me recusou os dados enviados. Revise razao social, responsável legal, endereço e conta bancária (titular, agência e conta).",
        message: "Não foi possível validar seus dados junto a Pagar.me.",
        title: "Validação recusada pela Pagar.me",
      };
    default:
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Editar dados financeiros",
        error: true,
        hint: "Se o erro persistir, revise os dados financeiros do recebedor antes de tentar novamente.",
        message: "Não foi possível sincronizar o recebedor.",
        title: "Falha na sincronização",
      };
  }
}

type ReleaseStepKey =
  "accepted" | "bank" | "company" | "kyc" | "partner" | "release";

type ReleaseStepState =
  "action" | "current" | "done" | "fail" | "todo" | "unknown";

/** Uma etapa do caminho até a Pagar.me liberar o recebedor para receber pagamentos. */
export type ReleaseStep = {
  detail: string;
  key: ReleaseStepKey;
  label: string;
  state: ReleaseStepState;
};

type StatusProgress = {
  detail?: string;
  reached: number;
  state: ReleaseStepState;
};

const RELEASE_STEP_ORDER: ReleaseStepKey[] = [
  "company",
  "partner",
  "bank",
  "accepted",
  "kyc",
  "release",
];

const RELEASE_STEP_COPY: Record<
  ReleaseStepKey,
  { detail: string; label: string }
> = {
  accepted: {
    detail: "A Pagar.me cria o recebedor e analisa o cadastro inicial.",
    label: "Cadastro aceito pela Pagar.me",
  },
  bank: {
    detail: `Conta PJ aberta no CNPJ da empresa, com titular de até ${BANK_HOLDER_NAME_MAX_LENGTH} caracteres.`,
    label: "Conta bancária no CNPJ",
  },
  company: {
    detail: "CNPJ, razão social, telefone com DDD e endereço comercial.",
    label: "Dados da empresa",
  },
  kyc: {
    detail: "Prova de vida do representante legal, quando a Pagar.me pedir.",
    label: "Verificação de identidade",
  },
  partner: {
    detail: "Sócio administrador com CPF, data de nascimento e endereço.",
    label: "Representante legal",
  },
  release: {
    detail: "Os pagamentos caem direto na conta da empresa.",
    label: "Liberado para receber",
  },
};

const ERROR_CODE_STEP: Record<string, ReleaseStepKey> = {
  papelito_pagarme_bank_account_update_auth_required: "bank",
  papelito_pagarme_bank_holder_mismatch: "bank",
  papelito_pagarme_invalid_company_name: "company",
  papelito_pagarme_invalid_holder_name: "bank",
  papelito_pagarme_invalid_phone: "company",
  papelito_pagarme_missing_address: "company",
  papelito_pagarme_missing_document: "company",
  papelito_pagarme_missing_draft: "company",
  papelito_pagarme_missing_partner: "partner",
  papelito_pagarme_missing_recipient: "company",
};

const REJECTED_GROUP_STEP: Record<string, ReleaseStepKey> = {
  bank_account: "bank",
  company: "company",
  partner: "partner",
};

const BLOCKED_STATUSES = new Set(["blocked", "inactive", "suspended"]);

/**
 * Diz em qual etapa de dados a última recusa travou, ou `null` quando o erro não é do cadastro.
 *
 * Falha de comunicação ou de configuração da Papelito não aponta para etapa nenhuma: o vendor
 * não tem o que corrigir. `request_failed` usa o grupo do primeiro campo recusado.
 */
export function findReleaseErrorStep(
  errorCode: string,
  rejectedFields: VendorRecipientRejectedField[],
): ReleaseStepKey | null {
  if (ERROR_CODE_STEP[errorCode]) return ERROR_CODE_STEP[errorCode];
  if (errorCode !== "papelito_pagarme_request_failed") return null;

  return (
    rejectedFields
      .map((field) => REJECTED_GROUP_STEP[field.group])
      .find(Boolean) ?? "accepted"
  );
}

function affiliationProgress(recipient: VendorRecipient): StatusProgress {
  if (
    recipient.kycStatus === "partially_denied" &&
    recipient.kycStatusReason === "additional_documents_required"
  ) {
    return {
      detail: "A Pagar.me pediu a prova de vida do representante legal.",
      reached: 4,
      state: "action",
    };
  }

  if (recipient.kycStatus === "pending") {
    return {
      detail: "A documentação está em análise na Pagar.me.",
      reached: 4,
      state: "current",
    };
  }

  return {
    detail:
      "A Pagar.me devolveu uma pendência que a Papelito ainda não reconhece.",
    reached: 4,
    state: "fail",
  };
}

function statusProgress(recipient: VendorRecipient): StatusProgress {
  const { recipientId, status } = recipient;

  if (status === "active")
    return { reached: RELEASE_STEP_ORDER.length, state: "done" };
  if (!recipientId && !status) return { reached: 0, state: "current" };
  if (status === "affiliation") return affiliationProgress(recipient);
  if (status === "refused") {
    return {
      detail: "A Pagar.me recusou o cadastro do recebedor.",
      reached: 3,
      state: "fail",
    };
  }
  if (BLOCKED_STATUSES.has(status)) {
    return {
      detail: `O recebedor está ${formatStatus(status).toLowerCase()} na Pagar.me.`,
      reached: 5,
      state: "fail",
    };
  }
  if (!status || status === "registration") {
    return {
      detail: "A Pagar.me está analisando o cadastro inicial.",
      reached: 3,
      state: "current",
    };
  }

  return {
    detail: `A Pagar.me devolveu um estado desconhecido (${status}).`,
    reached: 5,
    state: "unknown",
  };
}

function stepStateAt(
  index: number,
  progress: StatusProgress,
): ReleaseStepState {
  if (index < progress.reached) return "done";
  if (index === progress.reached) return progress.state;
  return "todo";
}

function applyErrorStep(
  states: ReleaseStepState[],
  errorIndex: number,
  hasRecipient: boolean,
) {
  return states.map((state, index) => {
    if (index < errorIndex)
      return state === "current" || state === "todo" ? "done" : state;
    if (index === errorIndex) return "fail";
    return hasRecipient ? state : "todo";
  });
}

/**
 * Traduz o estado do recebedor em seis etapas de liberação, na ordem em que a Pagar.me as exige.
 *
 * Sem leitura da Pagar.me, nenhuma etapa é afirmada. A recusa de um dado do cadastro marca a
 * etapa daquele dado, mesmo com o recebedor já criado, porque é ali que o vendor precisa corrigir.
 */
export function buildReleaseSteps(
  recipient: VendorRecipient,
  errorStep: ReleaseStepKey | null,
): ReleaseStep[] {
  if (recipient.loadFailed) {
    return RELEASE_STEP_ORDER.map((key) => ({
      ...RELEASE_STEP_COPY[key],
      key,
      state: "unknown",
    }));
  }

  const progress = statusProgress(recipient);
  const baseStates = RELEASE_STEP_ORDER.map((_, index) =>
    stepStateAt(index, progress),
  );
  const isActive = recipient.status === "active";
  const states =
    errorStep && !isActive
      ? applyErrorStep(
          baseStates,
          RELEASE_STEP_ORDER.indexOf(errorStep),
          Boolean(recipient.recipientId),
        )
      : baseStates;

  return RELEASE_STEP_ORDER.map((key, index) => {
    const usesProgressDetail =
      index === progress.reached && states[index] === progress.state;

    return {
      detail:
        (usesProgressDetail && progress.detail) ||
        RELEASE_STEP_COPY[key].detail,
      key,
      label: RELEASE_STEP_COPY[key].label,
      state: states[index],
    };
  });
}

const STEP_ICON: Record<ReleaseStepState, LucideIcon | null> = {
  action: ArrowRight,
  current: Clock,
  done: Check,
  fail: X,
  todo: null,
  unknown: CircleHelp,
};

const STEP_ICON_CLASSNAME: Record<ReleaseStepState, string> = {
  action: "border-[#1a1a1a] bg-[#1a1a1a] text-white",
  current: "border-[#1a1a1a] bg-white text-[#1a1a1a]",
  done: "border-[#15803d] bg-[#15803d] text-white",
  fail: "border-[#c0392b] bg-[#c0392b] text-white",
  todo: "border-dashed border-[#1a1a1a]/30 bg-white",
  unknown: "border-dashed border-[#1a1a1a]/40 bg-white text-[#1a1a1a]/50",
};

const STEP_BAR_CLASSNAME: Record<ReleaseStepState, string> = {
  action: "bg-[#1a1a1a]",
  current: "bg-[#1a1a1a]",
  done: "bg-[#15803d]",
  fail: "bg-[#c0392b]",
  todo: "bg-[#1a1a1a]/10",
  unknown: "bg-[#1a1a1a]/10",
};

const STEP_LABEL_CLASSNAME: Record<ReleaseStepState, string> = {
  action: "text-[#1a1a1a]",
  current: "text-[#1a1a1a]",
  done: "text-[#1a1a1a]",
  fail: "text-[#7a3428]",
  todo: "text-[#1a1a1a]/55",
  unknown: "text-[#1a1a1a]/55",
};

const STEP_STATE_LABEL: Record<ReleaseStepState, string> = {
  action: "Ação necessária",
  current: "Em andamento",
  done: "Concluída",
  fail: "Travada",
  todo: "Pendente",
  unknown: "Sem leitura",
};

const COUNT_CLASSNAME: Record<VerdictTone, string> = {
  andamento: "text-[#1a1a1a]",
  apto: "text-[#15803d]",
  ilegivel: "text-[#1a1a1a]/60",
  impedido: "text-[#7a3428]",
};

const NEUTRAL_PRIMARY_CLASSNAME =
  "border-[#1a1a1a] bg-[#1a1a1a] text-white hover:shadow-[3px_3px_0px_#1a1a1a] focus-visible:outline-[#1a1a1a]";

const VERDICT_PRIMARY_CLASSNAME: Record<VerdictTone, string> = {
  andamento: NEUTRAL_PRIMARY_CLASSNAME,
  apto: NEUTRAL_PRIMARY_CLASSNAME,
  ilegivel: NEUTRAL_PRIMARY_CLASSNAME,
  impedido:
    "border-[#7a3428] bg-[#7a3428] text-[#f7e6e2] hover:shadow-[3px_3px_0px_#c0392b] focus-visible:outline-[#7a3428]",
};

const ACTION_BUTTON_CLASSNAME =
  "inline-flex h-11 shrink-0 max-sm:w-full cursor-pointer items-center justify-center whitespace-nowrap border-2 px-5 text-xs font-black uppercase tracking-widest transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const SECONDARY_BUTTON_CLASSNAME = `${ACTION_BUTTON_CLASSNAME} border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white focus-visible:outline-[#1a1a1a]`;

const CALLOUT_ACTION_CLASSNAME =
  "mt-4 inline-flex h-10 cursor-pointer items-center border-2 border-[#7a3428] bg-[#7a3428] px-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#f7e6e2] transition hover:shadow-[3px_3px_0px_#c0392b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a3428]";

type FeedbackActionType = NonNullable<FeedbackState["actionType"]>;

type CalloutActionProps = {
  feedback: FeedbackState;
  onAction: (actionType: FeedbackActionType) => void;
};

function CalloutAction({ feedback, onAction }: Readonly<CalloutActionProps>) {
  const { actionHref, actionLabel, actionType } = feedback;
  if (!actionLabel) return null;

  if (actionType) {
    return (
      <button
        className={CALLOUT_ACTION_CLASSNAME}
        onClick={() => onAction(actionType)}
        type="button"
      >
        {actionLabel}
      </button>
    );
  }

  if (!actionHref) return null;

  return (
    <a className={CALLOUT_ACTION_CLASSNAME} href={actionHref}>
      {actionLabel}
    </a>
  );
}

type ReleaseErrorCalloutProps = CalloutActionProps & {
  fields: VendorRecipientRejectedField[];
  label?: string;
  live: boolean;
};

function ReleaseErrorCallout({
  feedback,
  fields,
  label,
  live,
  onAction,
}: Readonly<ReleaseErrorCalloutProps>) {
  const details = feedback.details?.filter(Boolean) ?? [];

  return (
    <div
      className="mt-3 border-2 border-[#c0392b] bg-[#f7e6e2] px-4 py-4 text-[#7a3428]"
      role={live ? "alert" : undefined}
    >
      {label ? (
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7a3428]/80">
          {label}
        </p>
      ) : null}
      <p className="mt-1 flex items-start gap-2 text-sm font-black">
        <TriangleAlert
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0"
          strokeWidth={2.4}
        />
        {feedback.title ?? feedback.message}
      </p>
      {feedback.title ? (
        <p className="mt-1.5 pl-6 text-sm leading-6 font-medium">
          {feedback.message}
        </p>
      ) : null}
      {details.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-10 text-[13px] font-medium">
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      {feedback.hint ? (
        <p className="mt-1 pl-6 text-[13px] leading-5 font-medium text-[#7a3428]/85">
          {feedback.hint}
        </p>
      ) : null}
      <RecipientRejectedFields fields={fields} />
      <CalloutAction feedback={feedback} onAction={onAction} />
    </div>
  );
}

type ReleaseStepItemProps = {
  children?: React.ReactNode;
  step: ReleaseStep;
};

function ReleaseStepItem({ children, step }: Readonly<ReleaseStepItemProps>) {
  const Icon = STEP_ICON[step.state];

  return (
    <li className="grid grid-cols-[auto_1fr] items-start gap-x-3.5 py-3.5 not-first:border-t-2 not-first:border-[#1a1a1a]/6">
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center border-2 ${STEP_ICON_CLASSNAME[step.state]}`}
      >
        {Icon ? <Icon className="size-4" strokeWidth={2.8} /> : null}
      </span>
      <div className="min-w-0 pt-1">
        <p className={`text-sm font-bold ${STEP_LABEL_CLASSNAME[step.state]}`}>
          <span className="sr-only">{STEP_STATE_LABEL[step.state]}: </span>
          {step.label}
        </p>
        <p className="mt-0.5 text-[13px] leading-5 text-[#1a1a1a]/60">
          {step.detail}
        </p>
      </div>
      {children ? (
        <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2">
          {children}
        </div>
      ) : null}
    </li>
  );
}

type ReleaseActionsProps = {
  isActive: boolean;
  onStartKyc: () => void;
  onSync: () => void;
  pending: boolean;
  verdict: RecipientVerdict;
};

function ReleaseActions({
  isActive,
  onStartKyc,
  onSync,
  pending,
  verdict,
}: Readonly<ReleaseActionsProps>) {
  const { primaryAction, primarySync, tone } = verdict;
  const primaryClassName = `${ACTION_BUTTON_CLASSNAME} ${VERDICT_PRIMARY_CLASSNAME[tone]}`;
  const showSecondarySync = !isActive && !primarySync;
  const showEditLink =
    primaryAction?.type !== "href" ||
    primaryAction.href !== EDIT_FINANCIAL_DATA_HREF;

  return (
    <div className="flex flex-wrap gap-3">
      {primaryAction?.type === "href" ? (
        <a className={primaryClassName} href={primaryAction.href}>
          {primaryAction.label}
        </a>
      ) : null}
      {primaryAction?.type === "kyc" ? (
        <button
          className={primaryClassName}
          disabled={pending}
          onClick={onStartKyc}
          type="button"
        >
          {pending ? "Preparando..." : primaryAction.label}
        </button>
      ) : null}
      {primarySync ? (
        <button
          className={primaryClassName}
          disabled={pending}
          onClick={onSync}
          type="button"
        >
          {pending ? "Consultando..." : primarySync.label}
        </button>
      ) : null}
      {showEditLink ? (
        <a
          className={SECONDARY_BUTTON_CLASSNAME}
          href={EDIT_FINANCIAL_DATA_HREF}
        >
          Editar dados financeiros
        </a>
      ) : null}
      {showSecondarySync ? (
        <button
          className={SECONDARY_BUTTON_CLASSNAME}
          disabled={pending}
          onClick={onSync}
          type="button"
        >
          {pending ? "Consultando..." : "Atualizar situação"}
        </button>
      ) : null}
    </div>
  );
}

type ReleaseFactsProps = {
  lastSync: string;
  recipient: VendorRecipient;
};

function ReleaseFacts({ lastSync, recipient }: Readonly<ReleaseFactsProps>) {
  return (
    <dl
      className="flex flex-wrap gap-x-5 gap-y-1.5 font-(--font-admin-mono) text-xs"
      data-numeric
    >
      <div className="flex gap-1.5">
        <dt className="uppercase tracking-wider text-[#1a1a1a]/60">Estado</dt>
        <dd className="font-semibold text-[#1a1a1a]">
          {recipient.loadFailed ? "Não lido" : formatStatus(recipient.status)}
        </dd>
      </div>
      <div className="flex min-w-0 gap-1.5">
        <dt className="uppercase tracking-wider text-[#1a1a1a]/60">
          Recebedor
        </dt>
        <dd className="font-semibold break-all text-[#1a1a1a]">
          {recipient.recipientId || "—"}
        </dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="uppercase tracking-wider text-[#1a1a1a]/60">Lido</dt>
        <dd className="font-semibold text-[#1a1a1a]">
          {lastSync || "nenhuma leitura"}
        </dd>
      </div>
    </dl>
  );
}

export function VendorRecipientPanel({
  initialRecipient,
}: Readonly<{ initialRecipient: VendorRecipient }>) {
  const router = useRouter();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [syncRejectedFields, setSyncRejectedFields] = useState<VendorRecipientRejectedField[]>([]);
  const [syncErrorCode, setSyncErrorCode] = useState("");
  const [pending, startTransition] = useTransition();
  const [supportPending, setSupportPending] = useState(false);

  const verdict = buildRecipientVerdict(recipient);
  const isActive = recipient.status === "active";
  const lastSync = formatRecipientSyncAt(recipient.lastSyncAt);
  const persistedError =
    !isActive && !recipient.loadFailed && (recipient.lastErrorCode || recipient.lastError)
      ? buildRecipientErrorFeedback({ code: recipient.lastErrorCode })
      : null;
  const persistedRejectedFields = persistedError ? recipient.rejectedFields : [];

  function syncRecipient() {
    setFeedback(null);
    setSyncRejectedFields([]);
    setSyncErrorCode("");

    startTransition(async () => {
      const response = await fetch("/api/vendor/recipient", { cache: "no-store" });

      const body = (await response.json().catch(() => null)) as
        | {
            code?: string;
            recipient_id?: string;
            status?: string;
            kyc_status?: string;
            kyc_status_reason?: string;
            last_sync_at?: string;
            last_error?: string;
            last_error_code?: string;
            last_error_fields?: unknown;
            fields?: unknown;
            message?: string;
          }
        | null;

      if (!response.ok) {
        setSyncRejectedFields(mapRejectedFields(body?.fields));
        setSyncErrorCode(body?.code ?? "");
        setFeedback(
          buildRecipientErrorFeedback({
            code: body?.code,
            message: body?.message,
          }),
        );
        return;
      }

      setRecipient({
        recipientId: body?.recipient_id || "",
        status: body?.status || "",
        kycStatus: body?.kyc_status || "",
        kycStatusReason: body?.kyc_status_reason || "",
        lastSyncAt: body?.last_sync_at || "",
        lastError: body?.last_error || "",
        lastErrorCode: body?.last_error_code || "",
        loadFailed: false,
        rejectedFields: mapRejectedFields(body?.last_error_fields),
      });
      setFeedback({
        error: false,
        message: "Leitura atualizada.",
      });
      // A casca do painel carrega o veredito de elegibilidade no servidor; sem isto o indicador
      // da navegação continuaria mostrando a pendência que a sincronização acabou de resolver.
      router.refresh();
    });
  }

  function startKyc() {
    setFeedback(null);
    setSyncErrorCode("");

    startTransition(async () => {
      const response = await fetch("/api/vendor/recipient/kyc-link", { method: "POST" });
      const body = (await response.json().catch(() => null)) as
        | {
            code?: string;
            message?: string;
            url?: string;
            recipientId?: string;
            status?: string;
            kycStatus?: string;
            kycStatusReason?: string;
            lastSyncAt?: string;
            lastError?: string;
            lastErrorCode?: string;
          }
        | null;

      if (!response.ok || !body?.url) {
        setSyncErrorCode(body?.code ?? "");
        setFeedback(buildRecipientErrorFeedback({ code: body?.code, message: body?.message }));
        return;
      }

      setRecipient({
        recipientId: body.recipientId || recipient.recipientId,
        status: body.status || recipient.status,
        kycStatus: body.kycStatus || recipient.kycStatus,
        kycStatusReason: body.kycStatusReason || recipient.kycStatusReason,
        lastSyncAt: body.lastSyncAt || recipient.lastSyncAt,
        lastError: body.lastError || "",
        lastErrorCode: body.lastErrorCode || "",
        loadFailed: false,
        rejectedFields: [],
      });
      window.location.assign(body.url);
    });
  }

  async function openPagarmeBankAccountSupport() {
    if (supportPending) return;

    setSupportPending(true);
    try {
      const thread = await createPagarmeBankAccountSupportThread();
      router.push(`/vendor/solicitacoes/${thread.threadId}`);
    } catch (cause) {
      setFeedback({
        error: true,
        message: cause instanceof Error ? cause.message : "Não foi possível iniciar a conversa com a Papelito.",
        title: "Não foi possível abrir o atendimento",
      });
    } finally {
      setSupportPending(false);
    }
  }

  const errorFeedback = feedback?.error ? feedback : persistedError;
  const errorFields = feedback?.error
    ? syncRejectedFields
    : persistedRejectedFields;
  const errorCode = feedback?.error ? syncErrorCode : recipient.lastErrorCode;
  const errorStep = errorFeedback
    ? findReleaseErrorStep(errorCode, errorFields)
    : null;
  const steps = buildReleaseSteps(recipient, errorStep);
  const doneCount = steps.filter((step) => step.state === "done").length;
  const syncConfirmation = feedback && !feedback.error ? feedback.message : "";

  function handleFeedbackAction(actionType: FeedbackActionType) {
    if (actionType === "pagarme-bank-account-support") {
      void openPagarmeBankAccountSupport();
    }
  }

  const errorCallout = errorFeedback ? (
    <ReleaseErrorCallout
      feedback={errorFeedback}
      fields={errorFields}
      label={feedback?.error ? undefined : "O que travou a última tentativa"}
      live={Boolean(feedback?.error)}
      onAction={handleFeedbackAction}
    />
  ) : null;

  return (
    <AnchoredSection
      bodyClassName="bg-white"
      description="A Papelito não retém o seu dinheiro: o pagamento vai direto para o recebedor da sua loja na Pagar.me. Sem recebedor ativo, o checkout recusa a venda."
      id="pagamentos"
      title="Pagamentos"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3 px-5 pt-6 md:px-6 md:pt-7">
        <div className="min-w-0 flex-[1_1_16rem]">
          <p
            className="text-xl leading-tight font-black text-balance uppercase tracking-tight text-[#1a1a1a] md:text-2xl"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {verdict.headline}
          </p>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 font-medium text-[#1a1a1a]/70">
            {verdict.detail}
          </p>
        </div>
        <p
          className={`shrink-0 border-2 border-current px-2.5 py-1 font-(--font-admin-mono) text-[13px] font-semibold ${COUNT_CLASSNAME[verdict.tone]}`}
          data-numeric
        >
          {recipient.loadFailed ? "?" : doneCount} de {steps.length} etapas
        </p>
      </div>

      <div
        aria-hidden="true"
        className="mt-5 grid grid-cols-6 gap-1 px-5 md:px-6"
      >
        {steps.map((step) => (
          <span
            className={`h-2 ${STEP_BAR_CLASSNAME[step.state]}`}
            key={step.key}
          />
        ))}
      </div>

      <ol
        aria-label="Etapas de liberação na Pagar.me"
        className="px-5 pt-2 pb-3 md:px-6"
      >
        {steps.map((step) => (
          <ReleaseStepItem key={step.key} step={step}>
            {step.key === errorStep ? errorCallout : null}
          </ReleaseStepItem>
        ))}
      </ol>

      {errorStep ? null : (
        <div className="px-5 pb-5 md:px-6">{errorCallout}</div>
      )}

      <div className="flex flex-col gap-4 border-t-2 border-[#1a1a1a] bg-[#fbf7ef] px-5 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <ReleaseFacts lastSync={lastSync} recipient={recipient} />
          <p
            className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#15803d]"
            role="status"
          >
            {syncConfirmation}
          </p>
        </div>
        <ReleaseActions
          isActive={isActive}
          onStartKyc={startKyc}
          onSync={syncRecipient}
          pending={pending}
          verdict={verdict}
        />
      </div>
    </AnchoredSection>
  );
}
