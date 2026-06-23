"use client";

import { useState, useTransition } from "react";

import { Panel } from "@/components/layout/operational-panel";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import type { VendorRecipient } from "@/features/vendor-recipient/types/vendor-recipient";

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

function formatStatus(value: string) {
  return STATUS_LABELS[value] || "Nao iniciado";
}

function buildRecipientErrorFeedback(body: {
  code?: string;
  details?: string[];
  message?: string;
}): FeedbackState {
  switch (body.code) {
    case "papelito_pagarme_missing_partner":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Preencher responsavel legal",
        error: true,
        hint: "Cadastre ao menos um responsavel legal ou socio administrador e tente sincronizar novamente.",
        message: "A Pagar.me exige uma pessoa fisica responsavel pela empresa para concluir o onboarding do recebedor.",
        title: "Responsavel legal pendente",
      };
    case "papelito_pagarme_missing_address":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar dados financeiros",
        error: true,
        hint: "Confira o endereco comercial e o endereco do responsavel legal antes de sincronizar novamente.",
        message: "Faltam dados de endereco obrigatorios para criar ou atualizar o recebedor.",
        title: "Endereco incompleto",
      };
    case "papelito_pagarme_missing_document":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar cadastro financeiro",
        error: true,
        hint: "O recebedor precisa de um CNPJ valido e coerente com os dados da empresa.",
        message: "Nao foi possivel sincronizar porque a documentacao da empresa esta incompleta.",
        title: "Documento da empresa pendente",
      };
    case "papelito_pagarme_missing_draft":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Preencher dados financeiros",
        error: true,
        hint: "Abra o formulario financeiro, complete KYC e conta bancaria e depois tente sincronizar novamente.",
        message: "Os dados financeiros do recebedor ainda nao foram preenchidos.",
        title: "Dados financeiros pendentes",
      };
    case "papelito_pagarme_request_failed":
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Revisar dados enviados",
        details: body.details,
        error: true,
        hint: "A Pagar.me recusou os dados enviados. Revise empresa, responsavel legal e conta bancaria.",
        message: body.message || "A Pagar.me recusou a sincronizacao do recebedor.",
        title: "Validacao recusada pela Pagar.me",
      };
    default:
      return {
        actionHref: EDIT_FINANCIAL_DATA_HREF,
        actionLabel: "Editar dados financeiros",
        details: body.details,
        error: true,
        hint: "Se o erro persistir, revise os dados financeiros do recebedor antes de tentar novamente.",
        message: body.message || "Nao foi possivel sincronizar o recebedor.",
        title: "Falha na sincronizacao",
      };
  }
}

export function VendorRecipientPanel({ initialRecipient }: { initialRecipient: VendorRecipient }) {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [pending, startTransition] = useTransition();

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
            message?: string;
            pagarme_errors?: string[];
          }
        | null;

      if (!response.ok) {
        setFeedback(
          buildRecipientErrorFeedback({
            code: body?.code,
            details: Array.isArray(body?.pagarme_errors) ? body.pagarme_errors : undefined,
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
      });
      setFeedback({
        error: false,
        message: refreshKyc ? "Link de KYC atualizado." : "Recebedor sincronizado.",
      });
    });
  }

  return (
    <Panel className="overflow-hidden">
      <div className="bg-brand-dark px-5 py-3 text-brand-yellow">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">Pagar.me</p>
      </div>
      <div className="space-y-5 px-5 py-6 md:px-6">
        <div>
          <h3
            className="text-2xl font-semibold uppercase tracking-widest"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Recebedor
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-brand-dark/68">
            Sua operacao financeira depende de um recebedor ativo no Pagar.me.
          </p>
        </div>

        <div className="grid gap-3 rounded-[20px] border border-brand-dark/12 bg-[#fbf7ef] p-5 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-dark/55">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-dark">{formatStatus(recipient.status)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-dark/55">
              Recipient ID
            </p>
            <p className="mt-1 break-all text-sm font-semibold text-brand-dark">
              {recipient.recipientId || "Ainda nao criado"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-dark/55">
              Ultima sincronizacao
            </p>
            <p className="mt-1 text-sm text-brand-dark">{recipient.lastSyncAt || "Sem sincronizacao"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-dark/55">
              Ultimo erro
            </p>
            <p className="mt-1 text-sm text-brand-dark">{recipient.lastError || "Nenhum"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-xs font-black uppercase tracking-widest text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => syncRecipient(false)}
            type="button"
          >
            {pending ? "Sincronizando..." : "Sincronizar"}
          </button>
          <button
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            onClick={() => syncRecipient(true)}
            type="button"
          >
            Atualizar KYC
          </button>
          <a
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
            href={EDIT_FINANCIAL_DATA_HREF}
          >
            Editar dados financeiros
          </a>
          {recipient.kycUrl ? (
            <a
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border-2 border-[#1a1a1a] bg-white px-5 text-xs font-black uppercase tracking-widest text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow"
              href={recipient.kycUrl}
              rel="noreferrer"
              target="_blank"
            >
              Abrir KYC
            </a>
          ) : null}
        </div>

        <FeedbackBanner feedback={feedback} />
      </div>
    </Panel>
  );
}
