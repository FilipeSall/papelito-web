"use client";

import { useState } from "react";

import { selectActiveCompany } from "@/features/company/client/company-client";
import type { AvailableCompany } from "@/features/company/types/company";
import { roleLabel } from "@/features/company/utils/labels";

type CompanySelectorProps = {
  companies: AvailableCompany[];
  activeCompanyId: number | null;
  onSelected: () => void;
};

/**
 * Seletor de empresa ativa (aparece quando há mais de uma membership ativa). A seleção é
 * persistida no servidor; o browser nunca decide a empresa sozinho.
 */
export function CompanySelector({ companies, activeCompanyId, onSelected }: CompanySelectorProps) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(companyId: number) {
    if (pendingId) return;
    setPendingId(companyId);
    setError(null);
    const result = await selectActiveCompany(companyId);
    setPendingId(null);
    if (!result.ok) {
      setError(`⚠ ${result.message}`);
      return;
    }
    onSelected();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Empresa ativa
        </h4>
      </div>
      {error ? <p className="text-sm font-bold text-[#c0392b]">{error}</p> : null}
      <ul className="space-y-2">
        {companies.map((company) => {
          const active = company.companyId === activeCompanyId;
          return (
            <li key={company.companyId}>
              <button
                type="button"
                disabled={pendingId !== null}
                aria-pressed={active}
                onClick={() => handleSelect(company.companyId)}
                className={`flex w-full cursor-pointer items-center justify-between border-2 px-4 py-3 text-left transition-shadow focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-[#1a7f37] bg-[#e8f5ec] shadow-[3px_3px_0px_#1a7f37]"
                    : "border-[#1a1a1a] bg-white hover:shadow-[3px_3px_0px_#1a1a1a]"
                }`}
              >
                <span>
                  <span className="block text-sm font-black uppercase tracking-[0.06em] text-[#1a1a1a]">
                    {company.tradeName || company.legalName}
                  </span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#231f20]">
                    {roleLabel(company.role)}
                  </span>
                </span>
                <span
                  className={`text-[11px] font-black uppercase tracking-[0.18em] ${
                    active ? "text-[#1a7f37]" : "text-[#1a1a1a]"
                  }`}
                >
                  {pendingId === company.companyId ? "..." : active ? "Ativa" : "Selecionar"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
