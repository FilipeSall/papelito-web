"use client";

import { useEffect, useState } from "react";
import { listCompanyAudit } from "@/features/company/client/company-client";
import type { CompanyAuditEvent, CompanyRole } from "@/features/company/types/company";

export function CompanyAuditSection({ role }: { role: CompanyRole | null }) {
  const [items, setItems] = useState<CompanyAuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canView = role === "owner" || role === "admin";
  useEffect(() => { if (!canView) return; void listCompanyAudit().then((result) => result.ok ? setItems(result.data.items) : setError(result.message)); }, [canView]);
  if (!canView) return null;

  return <section className="space-y-3"><h4 className="text-[11px] font-black uppercase tracking-[0.22em]">Histórico de segurança</h4>{error ? <p className="text-sm text-red-700">{error}</p> : <ul className="space-y-2">{items.map((item, index) => <li key={`${item.createdAt}-${index}`} className="border-2 border-[#1a1a1a] p-3 text-sm"><strong>{item.action}</strong><br />{item.actor?.displayName ?? "Sistema"} {item.target ? `→ ${item.target.displayName}` : ""}<br /><time>{item.createdAt}</time></li>)}</ul>}</section>;
}
