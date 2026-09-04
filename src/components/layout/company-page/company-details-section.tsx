"use client";

import { useState } from "react";

import {
  resendBillingEmailConfirmation,
  updateCompanyDetails,
} from "@/features/company/client/company-client";
import type { CompanyContext } from "@/features/company/types/company";
import { statusLabel } from "@/features/company/utils/status-tone";
import { formatCnpj } from "@/lib/validation/brazilian-documents";
import { emailsMatch, normalizeEmail } from "@/lib/validation/email";

import { StatusBadge } from "./atoms";

export function CompanyDetailsSection({
  context,
  onChanged,
}: {
  context: CompanyContext;
  onChanged: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(context.company?.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const canEdit = context.membershipRole === "owner" || context.membershipRole === "admin";
  const company = context.company;
  if (!company) return null;

  const pendingEmail = company.pendingBillingEmail ?? null;
  const isVerified = company.billingEmailStatus === "verified";

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const normalized = normalizeEmail(email);

    // Salvar o mesmo endereço já verificado não dispara nada no backend; avisar aqui evita um
    // "enviamos um e-mail" que nunca foi enviado.
    if (normalized && isVerified && emailsMatch(normalized, company?.billingEmail)) {
      setIsError(false);
      setMessage("Este e-mail já está confirmado. Nada a fazer.");
      setEmail("");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const result = await updateCompanyDetails({
      ...(normalized ? { billingEmail: normalized } : {}),
      phone,
    });

    setIsSaving(false);

    if (!result.ok) {
      setIsError(true);
      setMessage(`⚠ ${result.message}`);
      return;
    }

    setEmail("");
    setIsError(false);
    setMessage(feedbackForContext(result.data, normalized));
    await onChanged();
  }

  async function resend() {
    if (isResending) return;

    setIsResending(true);
    setMessage(null);

    const result = await resendBillingEmailConfirmation();

    setIsResending(false);

    if (!result.ok) {
      setIsError(true);
      setMessage(`⚠ ${result.message}`);
      return;
    }

    setIsError(false);
    setMessage("✓ Enviamos um novo link. O link anterior deixou de valer.");
    await onChanged();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Dados da empresa
        </h4>
      </div>

      <div className="space-y-2 border-2 border-[#1a1a1a] bg-white p-4 text-sm">
        <p className="text-sm font-black uppercase tracking-[0.04em] text-[#1a1a1a]">
          {company.legalName}
        </p>
        <p className="text-[13px] font-medium text-[#231f20]">CNPJ: {formatCnpj(company.cnpj)}</p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#231f20]">
            Situação
          </span>
          <StatusBadge status={company.status} label={statusLabel(company.status)} />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#231f20]">
            Receita
          </span>
          <StatusBadge
            status={company.registryStatus}
            label={statusLabel(company.registryStatus)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[13px] font-medium text-[#231f20]">
            E-mail de faturamento: {company.billingEmail ?? "Não informado"}
          </span>
          <StatusBadge
            status={company.billingEmailStatus}
            label={statusLabel(company.billingEmailStatus)}
          />
        </div>

        {pendingEmail ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-[#1a1a1a]/10 pt-2">
            <span className="text-[13px] font-medium text-[#231f20]">
              Aguardando confirmação de <strong className="font-black">{pendingEmail}</strong>. O
              link expira em 24 horas.
            </span>
            {canEdit ? (
              <button
                type="button"
                onClick={() => void resend()}
                disabled={isResending}
                className="cursor-pointer text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] underline decoration-brand-yellow decoration-2 underline-offset-4 focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResending ? "Reenviando..." : "Reenviar confirmação"}
              </button>
            ) : null}
          </div>
        ) : null}

        {!pendingEmail && !isVerified ? (
          <p className="border-t border-[#1a1a1a]/10 pt-2 text-[13px] font-medium text-[#231f20]">
            Informe abaixo o e-mail que deve receber os documentos fiscais para liberar as compras.
          </p>
        ) : null}

        <p className="text-[13px] font-medium text-[#231f20]">
          Telefone: {company.phone ?? "Não informado"}
        </p>
      </div>

      {canEdit ? (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={isVerified ? "Trocar e-mail de faturamento" : "E-mail de faturamento"}
            aria-label="E-mail de faturamento"
            className="h-11 border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefone"
            aria-label="Telefone"
            className="h-11 border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 cursor-pointer bg-[#1a1a1a] px-5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p className={`text-sm font-bold ${isError ? "text-[#c0392b]" : "text-[#1a7f37]"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}

/**
 * O backend decide se o endereço precisava de confirmação; a mensagem sai do estado que ele
 * devolveu, não de um palpite do cliente.
 */
function feedbackForContext(context: CompanyContext, requestedEmail: string): string {
  const company = context.company;

  if (!requestedEmail) {
    return "✓ Dados salvos.";
  }

  if (company?.pendingBillingEmail) {
    return `✓ Enviamos um link de confirmação para ${company.pendingBillingEmail}.`;
  }

  if (company?.billingEmailStatus === "verified") {
    return "✓ E-mail de faturamento confirmado — é o mesmo e-mail já verificado da sua conta.";
  }

  return "✓ Dados salvos.";
}
