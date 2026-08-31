"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import type { VendorRecipient } from "@/features/vendor-recipient/types/vendor-recipient";
import { createPagarmeBankAccountSupportThread } from "@/features/messages/services/message-client";

import { AnchoredSection } from "@/components/ui/anchored-sections";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";

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
const SUPPORT_HREF = "/vendor/mensagens";
const recipientDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

type VerdictTone = "apto" | "andamento" | "impedido" | "ilegivel";

type RecipientVerdict = {
  detail: string;
  headline: string;
  primaryAction: { href: string; label: string; external?: boolean } | null;
  primarySync: { label: string; refreshKyc: boolean } | null;
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
      primarySync: { label: "Tentar de novo", refreshKyc: false },
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
      primaryAction: { href: EDIT_FINANCIAL_DATA_HREF, label: "Preencher dados financeiros" },
      primarySync: null,
    };
  }

  switch (recipient.status) {
    case "registration":
      return {
        ...inProgress,
        detail: "O cadastro do recebedor está em andamento na Pagar.me.",
        primaryAction: { href: EDIT_FINANCIAL_DATA_HREF, label: "Revisar dados financeiros" },
        primarySync: null,
      };
    case "affiliation":
      return {
        ...inProgress,
        detail:
          "A Pagar.me ainda precisa verificar os documentos do responsável legal antes de liberar os pagamentos.",
        primaryAction: recipient.kycUrl
          ? { external: true, href: recipient.kycUrl, label: "Abrir verificação (KYC)" }
          : null,
        primarySync: recipient.kycUrl ? null : { label: "Gerar link de KYC", refreshKyc: true },
      };
    case "refused":
      return {
        ...blocked,
        detail: "A Pagar.me recusou o cadastro do recebedor da sua loja.",
        primaryAction: { href: EDIT_FINANCIAL_DATA_HREF, label: "Revisar dados financeiros" },
        primarySync: null,
      };
    case "suspended":
      return {
        ...blocked,
        detail: "O recebedor da sua loja está suspenso na Pagar.me.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito" },
        primarySync: null,
      };
    case "blocked":
      return {
        ...blocked,
        detail: "O recebedor da sua loja está bloqueado na Pagar.me.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito" },
        primarySync: null,
      };
    case "inactive":
      return {
        ...blocked,
        detail: "O recebedor da sua loja está inativo na Pagar.me.",
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito" },
        primarySync: null,
      };
    default:
      return {
        ...inProgress,
        detail: `A Pagar.me devolveu um estado que este painel ainda não conhece (${recipient.status}). Fale com a Papelito antes de contar com esta loja para vender.`,
        primaryAction: { href: SUPPORT_HREF, label: "Falar com a Papelito" },
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
    case "papelito_pagarme_bank_account_update_auth_required":
      return {
        actionType: "pagarme-bank-account-support",
        actionLabel: "Falar com o suporte da Papelito",
        error: true,
        hint: "A conta anterior permanece ativa até a Papelito concluir a autorização necessária.",
        message: "A Pagar.me exige uma autorização adicional para trocar a conta bancária cadastrada.",
        title: "Atualização bancária requer autorização",
      };
    case "papelito_pagarme_request_failed":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar dados enviados",
        error: true,
        hint: "A Pagar.me recusou os dados enviados. Revise razao social, responsável legal, endereço e conta bancária (agência e conta).",
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

const VERDICT_TONE_CLASSNAME: Record<VerdictTone, string> = {
  andamento: "border-[#1a1a1a] bg-[#1a1a1a] text-[#f5f1e8] shadow-[6px_6px_0px_#ffe500]",
  apto: "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a]",
  ilegivel: "border-[#1a1a1a] bg-[#1a1a1a] text-[#f5f1e8] shadow-[6px_6px_0px_#ffe500]",
  impedido: "border-[#c0392b] bg-[#f7e6e2] text-[#7a3428] shadow-[6px_6px_0px_#c0392b]",
};

const VERDICT_MUTED_CLASSNAME: Record<VerdictTone, string> = {
  andamento: "text-[#f5f1e8]/70",
  apto: "text-[#1a1a1a]/72",
  ilegivel: "text-[#f5f1e8]/70",
  impedido: "text-[#7a3428]/80",
};

const VERDICT_PRIMARY_CLASSNAME: Record<VerdictTone, string> = {
  andamento:
    "border-brand-yellow bg-brand-yellow text-[#1a1a1a] hover:shadow-[3px_3px_0px_#f5f1e8] focus-visible:outline-brand-yellow",
  apto: "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow hover:shadow-[3px_3px_0px_#1a1a1a] focus-visible:outline-[#1a1a1a]",
  ilegivel:
    "border-brand-yellow bg-brand-yellow text-[#1a1a1a] hover:shadow-[3px_3px_0px_#f5f1e8] focus-visible:outline-brand-yellow",
  impedido:
    "border-[#7a3428] bg-[#7a3428] text-[#f7e6e2] hover:shadow-[3px_3px_0px_#c0392b] focus-visible:outline-[#7a3428]",
};

const SECONDARY_BUTTON_CLASSNAME =
  "inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60";

export function VendorRecipientPanel({ initialRecipient }: { initialRecipient: VendorRecipient }) {
  const router = useRouter();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, startTransition] = useTransition();
  const [supportPending, setSupportPending] = useState(false);

  const verdict = buildRecipientVerdict(recipient);
  const { primaryAction, primarySync } = verdict;
  const isActive = recipient.status === "active";
  const showPlainSync = !primarySync || primarySync.refreshKyc;
  const kycIsPrimary = primaryAction?.external === true || primarySync?.refreshKyc === true;
  const lastSync = formatRecipientSyncAt(recipient.lastSyncAt);
  const persistedError =
    !isActive && !recipient.loadFailed && (recipient.lastErrorCode || recipient.lastError)
      ? buildRecipientErrorFeedback({ code: recipient.lastErrorCode })
      : null;

  function syncRecipient(refreshKyc: boolean) {
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch("/api/vendor/recipient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_kyc: refreshKyc }),
      });

      const body = (await response.json().catch(() => null)) as
        | {
            code?: string;
            recipient_id?: string;
            status?: string;
            last_sync_at?: string;
            kyc_url?: string;
            last_error?: string;
            last_error_code?: string;
            message?: string;
          }
        | null;

      if (!response.ok) {
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
        lastSyncAt: body?.last_sync_at || "",
        kycUrl: body?.kyc_url || "",
        lastError: body?.last_error || "",
        lastErrorCode: body?.last_error_code || "",
        loadFailed: false,
      });
      setFeedback({
        error: false,
        message: refreshKyc ? "Link de verificação atualizado." : "Leitura atualizada.",
      });
    });
  }

  async function openPagarmeBankAccountSupport() {
    if (supportPending) return;

    setSupportPending(true);
    try {
      const thread = await createPagarmeBankAccountSupportThread();
      router.push(`/vendor/mensagens/${thread.threadId}`);
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

  return (
    <AnchoredSection
      description="A Papelito não retém o seu dinheiro: o pagamento vai direto para o recebedor da sua loja na Pagar.me. Sem recebedor ativo, o checkout recusa a venda."
      id="pagamentos"
      title="Pagamentos"
    >
      <div className={`border-2 px-5 py-6 md:px-7 md:py-7 ${VERDICT_TONE_CLASSNAME[verdict.tone]}`}>
        <p
          className="text-2xl leading-tight font-black uppercase tracking-tight md:text-[2rem]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {verdict.headline}
        </p>
        <p className={`mt-3 max-w-2xl text-sm leading-6 font-medium ${VERDICT_MUTED_CLASSNAME[verdict.tone]}`}>
          {verdict.detail}
        </p>
        <p className={`mt-4 text-[11px] font-black uppercase tracking-[0.18em] ${VERDICT_MUTED_CLASSNAME[verdict.tone]}`}>
          {lastSync ? `Leitura de ${lastSync}` : "Nenhuma leitura registrada"}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {primaryAction ? (
            <a
              className={`inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap border-2 px-5 text-xs font-black uppercase tracking-widest transition focus-visible:outline-2 focus-visible:outline-offset-2 ${VERDICT_PRIMARY_CLASSNAME[verdict.tone]}`}
              href={primaryAction.href}
              rel={primaryAction.external ? "noreferrer" : undefined}
              target={primaryAction.external ? "_blank" : undefined}
            >
              {primaryAction.label}
            </a>
          ) : null}
          {primarySync ? (
            <button
              className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 px-5 text-xs font-black uppercase tracking-widest transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VERDICT_PRIMARY_CLASSNAME[verdict.tone]}`}
              disabled={pending}
              onClick={() => syncRecipient(primarySync.refreshKyc)}
              type="button"
            >
              {pending ? "Consultando..." : primarySync.label}
            </button>
          ) : null}
          {showPlainSync ? (
          <button
            className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 bg-transparent px-5 text-xs font-black uppercase tracking-widest underline-offset-4 transition hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              verdict.tone === "impedido"
                ? "border-[#7a3428]/40 text-[#7a3428] focus-visible:outline-[#7a3428]"
                : verdict.tone === "apto"
                  ? "border-[#1a1a1a]/35 text-[#1a1a1a] focus-visible:outline-[#1a1a1a]"
                  : "border-[#f5f1e8]/35 text-[#f5f1e8] focus-visible:outline-brand-yellow"
            }`}
            disabled={pending}
            onClick={() => syncRecipient(false)}
            type="button"
          >
            {pending ? "Consultando..." : "Atualizar leitura"}
          </button>
          ) : null}
        </div>
      </div>

      <FeedbackBanner
        className="mt-5"
        feedback={feedback}
        onAction={(actionType) => {
          if (actionType === "pagarme-bank-account-support") {
            void openPagarmeBankAccountSupport();
          }
        }}
      />

      {persistedError ? (
        <div className="mt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/70">
            O que travou a última tentativa
          </p>
          <FeedbackBanner
            className="mt-3"
            feedback={persistedError}
            live={false}
            onAction={(actionType) => {
              if (actionType === "pagarme-bank-account-support") {
                void openPagarmeBankAccountSupport();
              }
            }}
          />
        </div>
      ) : null}

      <div className="mt-7 border-t-2 border-[#1a1a1a]/12 pt-6">
        <dl className="grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/70">
              Estado na Pagar.me
            </dt>
            <dd className="mt-1.5 text-sm font-semibold text-[#1a1a1a]">
              {recipient.loadFailed ? "Não lido" : formatStatus(recipient.status)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/70">
              Identificador do recebedor
            </dt>
            <dd
              className="mt-1.5 text-sm break-all text-[#1a1a1a]"
              style={{ fontFamily: "var(--font-admin-mono)" }}
            >
              {recipient.recipientId || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1a1a]/70">
              Última leitura
            </dt>
            <dd className="mt-1.5 text-sm text-[#1a1a1a]">{lastSync || "—"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <a className={SECONDARY_BUTTON_CLASSNAME} href={EDIT_FINANCIAL_DATA_HREF}>
            Editar dados financeiros
          </a>
          {!isActive && !kycIsPrimary ? (
            <button
              className={SECONDARY_BUTTON_CLASSNAME}
              disabled={pending}
              onClick={() => syncRecipient(true)}
              type="button"
            >
              Gerar link de verificação (KYC)
            </button>
          ) : null}
        </div>
      </div>
    </AnchoredSection>
  );
}
