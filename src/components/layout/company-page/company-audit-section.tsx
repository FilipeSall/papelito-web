"use client";

import { useCallback, useEffect, useState } from "react";

import { listCompanyAudit } from "@/features/company/client/company-client";
import type { CompanyAuditEvent, CompanyRole } from "@/features/company/types/company";
import { auditCopy, type AuditTone } from "@/features/company/utils/audit-labels";
import { roleLabel } from "@/features/company/utils/labels";

const TONE_CLASSES: Record<AuditTone, string> = {
  neutral: "bg-[#1a1a1a]",
  positive: "bg-[#1a7f37]",
  warning: "bg-brand-yellow",
  danger: "bg-[#c0392b]",
};

/**
 * O backend pagina em 20 e não devolve total; uma página cheia é o único sinal de que pode haver
 * mais eventos, então o "carregar mais" é gated por isso.
 */
const PER_PAGE = 20;

export function CompanyAuditSection({ role }: { role: CompanyRole | null }) {
  const [items, setItems] = useState<CompanyAuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const canView = role === "owner" || role === "admin";

  const load = useCallback(async (target: number) => {
    setLoading(true);
    const result = await listCompanyAudit(target);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setItems((current) => (target === 1 ? result.data.items : [...current, ...result.data.items]));
    setHasMore(result.data.items.length >= (result.data.perPage || PER_PAGE));
    setPage(target);
  }, []);

  useEffect(() => {
    // load() liga o loading antes do primeiro await; mesmo padrão das demais seções da empresa.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (canView) void load(1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [canView, load]);

  if (!canView) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
          Histórico de segurança
        </h4>
      </div>

      {error ? <p className="text-sm font-bold text-[#c0392b]">⚠ {error}</p> : null}

      {!error && items.length === 0 && !loading ? (
        <p className="text-sm font-medium text-[#231f20]">
          Nenhuma movimentação registrada nesta empresa até agora.
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item, index) => {
            const copy = auditCopy(item.action);
            const actor = item.actor?.displayName ?? "Sistema";
            const actorRole = item.actor?.role ? roleLabel(item.actor.role) : null;
            return (
              <li
                key={`${item.createdAt}-${item.action}-${index}`}
                className="flex gap-3 border-2 border-[#1a1a1a] bg-white p-3"
              >
                <span
                  aria-hidden
                  className={`mt-1 h-3 w-3 shrink-0 rotate-45 ${TONE_CLASSES[copy.tone]}`}
                />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-black uppercase tracking-[0.04em] text-[#1a1a1a]">
                    {copy.title}
                  </p>
                  <p className="text-[13px] font-medium text-[#231f20]">{copy.description}</p>
                  <p className="text-[12px] font-medium text-[#231f20]">
                    Por <strong className="font-bold">{actor}</strong>
                    {actorRole ? ` (${actorRole})` : ""}
                    {item.target ? ` · Afetou ${item.target.displayName}` : ""}
                  </p>
                  <time
                    dateTime={toIsoUtc(item.createdAt)}
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#231f20]"
                  >
                    {formatAuditDate(item.createdAt)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {loading ? (
        <p className="text-sm font-medium text-[#231f20]">Carregando histórico...</p>
      ) : null}

      {hasMore && !loading ? (
        <button
          type="button"
          onClick={() => void load(page + 1)}
          className="h-9 cursor-pointer border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition-shadow hover:shadow-[3px_3px_0px_#1a1a1a] focus:outline-2 focus:outline-offset-2 focus:outline-brand-yellow"
        >
          Ver eventos anteriores
        </button>
      ) : null}
    </section>
  );
}

/**
 * O WP grava `created_at` em UTC no formato MySQL (`YYYY-MM-DD HH:MM:SS`), sem timezone. Sem o
 * sufixo Z o browser interpretaria como horário local e deslocaria o evento.
 */
function toIsoUtc(value: string): string {
  if (!value) return "";
  if (value.includes("T")) return value;
  return `${value.replace(" ", "T")}Z`;
}

function formatAuditDate(value: string): string {
  const date = new Date(toIsoUtc(value));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
