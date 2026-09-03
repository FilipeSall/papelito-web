import Link from "next/link";
import { ArrowRight, MapPin, TriangleAlert, User } from "lucide-react";

import type { AdminUsersSnapshot } from "@/lib/server/admin-users";
import type { AdminUsersFilters } from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

import { FOCUS_RING } from "../../primitives";

import { ACCOUNTS_PATH, formatCnpj, formatRelativeTime, personHref } from "./accounts-config";
import { EmptyResult, InlineAlert, ResultFrame, ResultRow } from "./accounts-shell";
import { Pagination } from "./pagination";
import { AccountStatusChip, EntityMark } from "./status-chip";

/**
 * Vendors são contas com role `seller`, e por isso vêm da mesma fonte das pessoas — só o recorte
 * muda. O que a linha mostra é o que define um vendor na operação: loja, praça, CNPJ e cobertura.
 */
export function VendorsList({
  filters,
  snapshot,
}: {
  filters: AdminUsersFilters;
  snapshot: AdminUsersSnapshot;
}) {
  // Erro de API não pode virar estado vazio: "nenhum registro" e "não consegui ler" levam o
  // administrador a conclusões opostas.
  if (snapshot.issues.length > 0) {
    return <InlineAlert tone="critical">{snapshot.issues.join(" · ")}</InlineAlert>;
  }

  if (snapshot.rows.length === 0) {
    return (
      <EmptyResult
        body="Use Novo vendor para cadastrar uma distribuidora ou promover uma conta existente."
        title="Nenhum vendor neste recorte"
      />
    );
  }

  return (
    <ResultFrame
      footer={
        snapshot.totalPages > 1 ? (
          <Pagination
            currentPage={snapshot.currentPage}
            hrefFor={(page) => {
              const query = buildAdminUsersQuery(filters, { page });
              return query ? `${ACCOUNTS_PATH}?${query}` : `${ACCOUNTS_PATH}?tab=vendors`;
            }}
            totalPages={snapshot.totalPages}
          />
        ) : null
      }
      summary={`${snapshot.totalRows} vendor${snapshot.totalRows === 1 ? "" : "s"} neste recorte`}
    >
      {snapshot.rows.map((row) => {
        const location = [row.city, row.state].filter(Boolean).join(" / ");

        return (
          <ResultRow
            href={personHref(row.id)}
            key={`vendor-${row.id}`}
            lead={
              <div className="flex items-center gap-3">
                <EntityMark kind="vendor" label="Vendor" />
                <div className="min-w-0">
                  <p className="truncate font-black uppercase tracking-tight text-[#1a1a1a]">
                    {row.storeName || row.name || `Vendor #${row.id}`}
                  </p>
                  <p className="truncate font-mono text-xs text-[#231f20]/60">
                    {row.cnpj ? formatCnpj(row.cnpj) : "sem CNPJ"}
                  </p>
                </div>
              </div>
            }
            meta={
              <div className="flex items-start gap-2">
                <ArrowRight
                  aria-hidden
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/35"
                  strokeWidth={2.4}
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold text-[#231f20]">
                    <User aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                    <span className="truncate">{row.name || row.email || "Responsável"}</span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden className="h-3 w-3" strokeWidth={2.4} />
                      {location || "sem praça"}
                    </span>
                    {row.hasCoverage ? (
                      <span>com cobertura</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#c0392b]">
                        <TriangleAlert aria-hidden className="h-3 w-3" strokeWidth={2.4} />
                        sem cobertura
                      </span>
                    )}
                  </p>
                </div>
              </div>
            }
            trailing={
              <>
                <Link
                  className={[
                    "relative z-10 inline-flex h-9 items-center border-2 border-[#1a1a1a] bg-white px-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] transition hover:bg-brand-yellow",
                    FOCUS_RING,
                  ].join(" ")}
                  href={`/admin/vendors/${row.id}`}
                >
                  Operação
                </Link>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/45">
                  {formatRelativeTime(row.registeredAt)}
                </span>
                <AccountStatusChip fallbackLabel={row.accountStatusLabel} status={row.accountStatus} />
              </>
            }
          />
        );
      })}
    </ResultFrame>
  );
}
