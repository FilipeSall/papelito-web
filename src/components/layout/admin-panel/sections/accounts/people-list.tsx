import Link from "next/link";
import { ArrowRight, Building2, Store } from "lucide-react";

import type { AdminUserRow, AdminUsersSnapshot } from "@/lib/server/admin-users";
import type { AdminUsersFilters } from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

import { FOCUS_RING } from "../../primitives";

import {
  ACCOUNTS_PATH,
  companyHref,
  formatRelativeTime,
  membershipRoleLabel,
  membershipStatusLabel,
  personHref,
} from "./accounts-config";
import { EmptyResult, InlineAlert, ResultFrame, ResultRow } from "./accounts-shell";
import { Pagination } from "./pagination";
import { AccountStatusChip, EntityMark } from "./status-chip";

function detailHref(row: AdminUserRow, filters: AdminUsersFilters) {
  if (row.recordType === "pre_account_application") {
    const params = new URLSearchParams(buildAdminUsersQuery(filters));
    params.set("preAccountApplication", String(row.id));
    return `${ACCOUNTS_PATH}?${params.toString()}`;
  }

  const params = new URLSearchParams();
  if (filters.page > 1) params.set("originPage", String(filters.page));
  if (filters.search) params.set("originSearch", filters.search);
  if (filters.role !== "all") params.set("originRole", filters.role);
  if (filters.status !== "all") params.set("originStatus", filters.status);
  if (filters.relation !== "all") params.set("originRelation", filters.relation);

  return personHref(row.id, params.toString());
}

/**
 * A relação da pessoa em uma linha só: empresa quando existe vínculo, loja quando é vendor.
 * As duas nunca coexistem no domínio, então competir por espaço seria ruído.
 */
function Relationship({ row }: { row: AdminUserRow }) {
  if (row.company) {
    return (
      <div className="flex items-start gap-2">
        <ArrowRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/35"
          strokeWidth={2.4}
        />
        <div className="min-w-0">
          <Link
            className={[
              "relative z-10 inline-flex items-center gap-1.5 font-bold text-[#231f20] underline-offset-2 hover:underline",
              FOCUS_RING,
            ].join(" ")}
            href={companyHref(row.company.companyId)}
          >
            <Building2 aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            <span className="truncate">
              {row.company.companyName || `Empresa #${row.company.companyId}`}
            </span>
          </Link>
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
            {membershipRoleLabel(row.company.membershipRole)} ·{" "}
            {membershipStatusLabel(row.company.membershipStatus)}
          </p>
        </div>
      </div>
    );
  }

  if (row.isVendor) {
    const location = [row.city, row.state].filter(Boolean).join(" / ");

    return (
      <div className="flex items-start gap-2">
        <ArrowRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/35"
          strokeWidth={2.4}
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-bold text-[#231f20]">
            <Store aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            <span className="truncate">{row.storeName || "Loja sem nome"}</span>
          </p>
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
            {location || "Sem cidade"} · {row.hasCoverage ? "com cobertura" : "sem cobertura"}
          </p>
        </div>
      </div>
    );
  }

  // Administrador não é uma conta "sem empresa": ele é a Papelito. Dizer o contrário sugeriria um
  // cadastro incompleto onde não há nenhum.
  if (row.role === "administrator") {
    return (
      <div className="flex items-start gap-2">
        <ArrowRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/35"
          strokeWidth={2.4}
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-bold text-[#231f20]">
            <span aria-hidden className="inline-block h-3 w-3 shrink-0 rotate-45 bg-brand-yellow" />
            <span className="truncate">Papelito</span>
          </p>
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
            equipe interna
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/40">
      sem vínculo empresarial
    </p>
  );
}

export function PeopleList({
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
        body="Ajuste a busca, o perfil ou a situação para encontrar outras contas."
        title="Nenhuma conta neste recorte"
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
              return query ? `${ACCOUNTS_PATH}?${query}` : ACCOUNTS_PATH;
            }}
            totalPages={snapshot.totalPages}
          />
        ) : null
      }
      summary={`${snapshot.totalRows} conta${snapshot.totalRows === 1 ? "" : "s"} neste recorte`}
    >
      {snapshot.rows.map((row) => (
        <ResultRow
          href={detailHref(row, filters)}
          key={`person-${row.id}`}
          lead={
            <div className="flex items-center gap-3">
              <EntityMark kind={row.isVendor ? "vendor" : "person"} label={row.roleLabel || "Conta"} />
              <div className="min-w-0">
                <p className="truncate font-black uppercase tracking-tight text-[#1a1a1a]">
                  {row.name || row.email || `Candidatura #${row.id}`}
                </p>
                <p className="truncate text-xs text-[#231f20]/60">{row.email || "—"}</p>
              </div>
            </div>
          }
          meta={<Relationship row={row} />}
          trailing={
            <>
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/45">
                {row.roleLabel || "Outro"} · {formatRelativeTime(row.registeredAt)}
              </span>
              <AccountStatusChip fallbackLabel={row.accountStatusLabel} status={row.accountStatus} />
            </>
          }
        />
      ))}
    </ResultFrame>
  );
}
