"use client";

import { useState } from "react";

import { updateCompanyDetails } from "@/features/company/client/company-client";
import type { CompanyContext } from "@/features/company/types/company";
import { statusLabel } from "@/features/company/utils/status-tone";

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

  const canEdit = context.membershipRole === "owner" || context.membershipRole === "admin";
  const company = context.company;
  if (!company) return null;

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await updateCompanyDetails({ ...(email ? { billingEmail: email } : {}), phone });
    if (!result.ok) {
      setIsError(true);
      setMessage(`⚠ ${result.message}`);
      return;
    }
    setEmail("");
    setIsError(false);
    setMessage("✓ Dados enviados. Confirme o novo e-mail de faturamento quando aplicável.");
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
        <p className="text-[13px] font-medium text-[#231f20]">CNPJ: {company.cnpj}</p>

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
            placeholder="Novo e-mail de faturamento"
            className="h-11 border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefone"
            className="h-11 border-2 border-[#1a1a1a] bg-white px-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
          />
          <button
            type="submit"
            className="h-11 cursor-pointer bg-[#1a1a1a] px-5 text-[12px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Salvar e confirmar
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
