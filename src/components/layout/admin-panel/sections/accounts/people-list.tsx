import { ArrowRight, Building2, Store } from "lucide-react";

import type { AdminUserRow, AdminUsersSnapshot } from "@/lib/server/admin-users";
import type { AdminUsersFilters } from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

import {
  ACCOUNTS_PATH,
  companyHref,
  formatRelativeTime,
  membershipRoleLabel,
  membershipStatusLabel,
  personHref,
} from "./accounts-config";
import { EmptyResult, InlineAlert, ResultFrame, ResultRow } from "./accounts-shell";
import { OverflowReveal } from "./overflow-reveal";
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
function Relationship({ href, row }: Readonly<{ href: string; row: AdminUserRow }>) {
  if (row.company) {
    return (
      <div className="flex items-start gap-2">
        <ArrowRight
          aria-hidden
          className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/35"
          strokeWidth={2.4}
        />
        <div className="min-w-0">
          <OverflowReveal
            className="font-bold text-[#231f20]"
            href={companyHref(row.company.companyId)}
            interactive="always"
            leading={<Building2 aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
            text={row.company.companyName || `Empresa #${row.company.companyId}`}
            underline
          />
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
          <OverflowReveal
            className="font-bold text-[#231f20]"
            href={href}
            leading={<Store aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />}
            text={row.storeName || "Loja sem nome"}
          />
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
}: Readonly<{
  filters: AdminUsersFilters;
  snapshot: AdminUsersSnapshot;
}>) {
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
        <PersonRow filters={filters} key={`person-${row.id}`} row={row} />
      ))}
    </ResultFrame>
  );
}

function PersonRow({ filters, row }: Readonly<{ filters: AdminUsersFilters; row: AdminUserRow }>) {
  const href = detailHref(row, filters);

  return (
    <ResultRow
      href={href}
      lead={
        <div className="flex items-center gap-3">
          <EntityMark kind={row.isVendor ? "vendor" : "person"} label={row.roleLabel || "Conta"} />
          <div className="min-w-0">
            <OverflowReveal
              className="font-black uppercase tracking-tight text-[#1a1a1a]"
              href={href}
              text={row.name || row.email || `Candidatura #${row.id}`}
            />
            <OverflowReveal className="text-xs text-[#231f20]/60" href={href} text={row.email || "—"} />
          </div>
        </div>
      }
      meta={<Relationship href={href} row={row} />}
      trailing={
        <>
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/45">
            {row.roleLabel || "Outro"} · {formatRelativeTime(row.registeredAt)}
          </span>
          <AccountStatusChip fallbackLabel={row.accountStatusLabel} status={row.accountStatus} />
        </>
      }
    />
  );
}
