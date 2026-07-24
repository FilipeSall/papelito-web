"use client";

import { useState } from "react";

type Company = { id: number; legal_name: string; registry_status: string; ownership_status: string; created_at: string };
type Detail = { company: { legalName: string; tradeName: string | null; registryStatus: string; ownershipStatus: string; companyStatus: string; providerSource: string | null; providerCheckedAt: string | null; rejectionReason: string | null }; evidence: Record<string, unknown> | null; members: Array<{ userId: number; role: string; status: string }>; events: Array<{ action: string; createdAt: string; evidence: Record<string, unknown> | null }> };

export function CompanyReviewList({ companies }: { companies: Company[] }) {
  const [selected, setSelected] = useState<Company | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function open(company: Company) {
    setSelected(company);
    setMessage(null);
    const response = await fetch(`/api/admin/companies/${company.id}`);
    setDetail(response.ok ? (await response.json() as Detail) : null);
  }

  async function transition(action: "approve" | "reject") {
    if (!selected || (action === "reject" && !reason.trim())) {
      setMessage("Informe o motivo obrigatório para rejeitar.");
      return;
    }
    setBusy(true);
    const response = await fetch(`/api/admin/companies/${selected.id}/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "reject" ? { reason } : {}) });
    setMessage(response.ok ? `Empresa ${action === "approve" ? "aprovada" : "rejeitada"}.` : "Não foi possível concluir a decisão.");
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto border-2 border-brand-dark bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b-2 border-brand-dark bg-brand-yellow"><th className="p-3">Empresa</th><th className="p-3">Registro</th><th className="p-3">Ownership</th><th className="p-3">Criada</th><th className="p-3">Ação</th></tr></thead><tbody>{companies.map((company) => <tr className="border-b" key={company.id}><td className="p-3 font-bold">{company.legal_name}</td><td className="p-3">{company.registry_status}</td><td className="p-3">{company.ownership_status}</td><td className="p-3">{company.created_at}</td><td className="p-3"><button onClick={() => void open(company)} className="font-black underline">Detalhes</button></td></tr>)}{companies.length === 0 ? <tr><td className="p-4" colSpan={5}>Nenhuma empresa pendente.</td></tr> : null}</tbody></table></div>
      {selected && detail ? <section className="border-2 border-brand-dark bg-white p-5"><h2 className="text-xl font-black uppercase">{detail.company.legalName}</h2><p className="text-sm">{detail.company.tradeName || ""} · {detail.company.companyStatus} · {detail.company.registryStatus}</p><h3 className="mt-4 text-xs font-black uppercase">Evidências resumidas</h3><pre className="mt-2 overflow-auto bg-[#faf8f2] p-3 text-xs">{JSON.stringify(detail.evidence, null, 2)}</pre><h3 className="mt-4 text-xs font-black uppercase">Memberships</h3><ul className="text-sm">{detail.members.map((member) => <li key={member.userId}>Usuário {member.userId}: {member.role} · {member.status}</li>)}</ul><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo obrigatório em caso de rejeição" className="mt-4 min-h-20 w-full border-2 border-brand-dark p-3" /><div className="mt-3 flex gap-3"><button disabled={busy} onClick={() => void transition("approve")} className="bg-brand-yellow px-4 py-2 text-xs font-black uppercase">Aprovar</button><button disabled={busy} onClick={() => void transition("reject")} className="bg-brand-dark px-4 py-2 text-xs font-black uppercase text-white">Rejeitar</button></div>{message ? <p role="status" className="mt-3 text-sm font-bold">{message}</p> : null}<h3 className="mt-5 text-xs font-black uppercase">Auditoria</h3><ul className="text-xs">{detail.events.map((event) => <li key={`${event.action}-${event.createdAt}`}>{event.createdAt} · {event.action}</li>)}</ul></section> : null}
    </div>
  );
}
