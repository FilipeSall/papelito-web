"use client";

import { useState, useTransition } from "react";

import { Panel } from "@/components/layout/operational-panel";
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

function formatStatus(value: string) {
  return STATUS_LABELS[value] || "Nao iniciado";
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
        setFeedback({
          error: true,
          message: body?.message || "Nao foi possivel sincronizar o recebedor.",
          details: Array.isArray(body?.pagarme_errors) ? body.pagarme_errors : undefined,
        });
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
            className="rounded-full bg-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-yellow disabled:opacity-50"
            disabled={pending}
            onClick={() => syncRecipient(false)}
            type="button"
          >
            {pending ? "Sincronizando..." : "Sincronizar"}
          </button>
          <button
            className="rounded-full border border-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-dark disabled:opacity-50"
            disabled={pending}
            onClick={() => syncRecipient(true)}
            type="button"
          >
            Atualizar KYC
          </button>
          {recipient.kycUrl ? (
            <a
              className="rounded-full border border-brand-dark/20 px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-dark"
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
