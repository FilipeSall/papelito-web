"use client";

import { useEffect, useState } from "react";

import {
  approveAccessRequest,
  listAccessRequests,
  rejectAccessRequest,
} from "@/features/company/client/company-client";
import {
  ASSIGNABLE_ROLES,
  canManageMembers,
  type CompanyAccessRequest,
  type CompanyRole,
} from "@/features/company/types/company";
import { roleLabel } from "@/features/company/utils/labels";

type CompanyAccessRequestsSectionProps = {
  viewerRole: CompanyRole | null;
  onChanged: () => void;
};

/**
 * Solicitações de entrada na empresa. Titular/admin aprovam (definindo o papel) ou rejeitam com
 * motivo. Não expõe dados sensíveis do solicitante além do necessário.
 */
export function CompanyAccessRequestsSection({
  viewerRole,
  onChanged,
}: CompanyAccessRequestsSectionProps) {
  const [requests, setRequests] = useState<CompanyAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const canManage = canManageMembers(viewerRole);

  async function reload() {
    setLoading(true);
    const result = await listAccessRequests();
    setLoading(false);
    if (!result.ok) {
      setError(`⚠ ${result.message}`);
      return;
    }
    setError(null);
    setRequests(result.data.items);
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (canManage) void reload();
    else setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [canManage]);

  async function run(id: number, action: () => Promise<{ ok: boolean; message?: string }>) {
    if (pendingId) return;
    setPendingId(id);
    setError(null);
    const result = await action();
    setPendingId(null);
    if (!result.ok) {
      setError(`⚠ ${result.message ?? "Falha na operação."}`);
      return;
    }
    await reload();
    onChanged();
  }

  if (!canManage) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Solicitações de acesso
        </h4>
      </div>
      {error ? <p className="text-sm font-bold text-[#c0392b]">{error}</p> : null}
      {loading ? (
        <p className="text-sm font-medium text-[#231f20]">Carregando solicitações...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm font-medium text-[#231f20]">Nenhuma solicitação pendente.</p>
      ) : (
        <ul className="space-y-2">
          {requests.map((request) => {
            const busy = pendingId === request.memberId;
            return (
              <li
                key={request.memberId}
                className="border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0px_#1a1a1a]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.04em] text-[#1a1a1a]">
                      {request.displayName || request.email}
                    </p>
                    <p className="text-[12px] font-medium text-[#231f20]">{request.email}</p>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#231f20]">
                    {request.attempts > 1 ? `${request.attempts} tentativas` : "1 tentativa"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`approve-role-${request.memberId}`}>
                    Papel ao aprovar
                  </label>
                  <select
                    id={`approve-role-${request.memberId}`}
                    disabled={busy}
                    defaultValue="buyer"
                    className="h-9 border-2 border-[#1a1a1a] bg-white px-2 text-[12px] font-bold uppercase tracking-[0.08em] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const select = document.getElementById(
                        `approve-role-${request.memberId}`,
                      ) as HTMLSelectElement | null;
                      const role = (select?.value ?? "buyer") as CompanyRole;
                      void run(request.memberId, () => approveAccessRequest(request.memberId, role));
                    }}
                    className="h-9 bg-[#1a1a1a] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition-shadow hover:shadow-[1px_1px_0px_#ffe500] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-40"
                  >
                    {busy ? "..." : "Aprovar"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const reason = window.prompt("Motivo da rejeição:");
                      if (reason && reason.trim()) {
                        void run(request.memberId, () =>
                          rejectAccessRequest(request.memberId, reason.trim()),
                        );
                      }
                    }}
                    className="h-9 border-2 border-[#c0392b] bg-white px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#c0392b] transition-shadow hover:shadow-[3px_3px_0px_#c0392b] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow disabled:opacity-40"
                  >
                    {busy ? "..." : "Rejeitar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
