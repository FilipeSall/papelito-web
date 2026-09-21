"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import type {
  VendorRecipient,
  VendorRecipientRejectedField,
} from "@/features/vendor-recipient/types/vendor-recipient";
import { mapRejectedFields } from "@/features/vendor-recipient/utils/rejected-fields";
import { createPagarmeBankAccountSupportThread } from "@/features/chamados/services/chamado-client";

import { AnchoredSection } from "@/components/ui/anchored-sections";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
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

export function VendorRecipientPanel({
  initialRecipient,
}: Readonly<{ initialRecipient: VendorRecipient }>) {
  const router = useRouter();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [syncRejectedFields, setSyncRejectedFields] = useState<VendorRecipientRejectedField[]>([]);
  const [pending, startTransition] = useTransition();
  const [supportPending, setSupportPending] = useState(false);

  const verdict = buildRecipientVerdict(recipient);
  const { primaryAction, primarySync } = verdict;
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
          {primaryAction?.type === "href" ? (
            <a
              className={`inline-flex h-11 shrink-0 items-center justify-center whitespace-nowrap border-2 px-5 text-xs font-black uppercase tracking-widest transition focus-visible:outline-2 focus-visible:outline-offset-2 ${VERDICT_PRIMARY_CLASSNAME[verdict.tone]}`}
              href={primaryAction.href}
            >
              {primaryAction.label}
            </a>
          ) : null}
          {primaryAction?.type === "kyc" ? (
            <button
              className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 px-5 text-xs font-black uppercase tracking-widest transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VERDICT_PRIMARY_CLASSNAME[verdict.tone]}`}
              disabled={pending}
              onClick={startKyc}
              type="button"
            >
              {pending ? "Preparando..." : primaryAction.label}
            </button>
          ) : null}
          {primarySync ? (
            <button
              className={`inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 px-5 text-xs font-black uppercase tracking-widest transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VERDICT_PRIMARY_CLASSNAME[verdict.tone]}`}
              disabled={pending}
              onClick={syncRecipient}
              type="button"
            >
              {pending ? "Consultando..." : primarySync.label}
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
      <RecipientRejectedFields fields={syncRejectedFields} />

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
          <RecipientRejectedFields fields={persistedRejectedFields} />
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
          {!isActive ? (
            <button className={SECONDARY_BUTTON_CLASSNAME} disabled={pending} onClick={syncRecipient} type="button">
              Atualizar situação
            </button>
          ) : null}
        </div>
      </div>
    </AnchoredSection>
  );
}
