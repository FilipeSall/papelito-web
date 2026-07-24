"use client";

import { useState } from "react";

import { updateCompanyDetails } from "@/features/company/client/company-client";
import type { CompanyContext } from "@/features/company/types/company";

export function CompanyDetailsSection({ context, onChanged }: { context: CompanyContext; onChanged: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(context.company?.phone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const canEdit = context.membershipRole === "owner" || context.membershipRole === "admin";
  const company = context.company;
  if (!company) return null;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await updateCompanyDetails({ ...(email ? { billingEmail: email } : {}), phone });
    if (!result.ok) { setMessage(result.message); return; }
    setEmail(""); setMessage("Dados enviados. Confirme o novo e-mail de faturamento quando aplicável."); await onChanged();
  }
  return <section className="space-y-3"><h4 className="text-[11px] font-black uppercase tracking-[0.22em]">Dados da empresa</h4><div className="border-2 border-[#1a1a1a] bg-white p-4 text-sm"><p><strong>{company.legalName}</strong></p><p>CNPJ: {company.cnpj}</p><p>Status: {company.status} · {company.registryStatus}</p><p>E-mail de faturamento: {company.billingEmail ?? "Aguardando confirmação"}</p><p>Telefone: {company.phone ?? "Não informado"}</p></div>{canEdit ? <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Novo e-mail de faturamento" className="border-2 border-[#1a1a1a] p-2" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" className="border-2 border-[#1a1a1a] p-2" /><button className="border-2 border-[#1a1a1a] px-3 py-2 text-xs font-black uppercase">Salvar e confirmar</button></form> : null}{message ? <p className="text-sm">{message}</p> : null}</section>;
}
