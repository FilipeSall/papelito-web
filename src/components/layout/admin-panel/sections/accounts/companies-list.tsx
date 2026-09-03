import Link from "next/link";
import { ArrowRight, TriangleAlert, User, Users } from "lucide-react";

import type { AdminCompaniesFilters, AdminCompaniesSnapshot } from "@/lib/server/admin-companies";

import { FOCUS_RING } from "../../primitives";

import {
  ACCOUNTS_PATH,
  companyDisplayName,
  companyHref,
  formatCnpj,
  personHref,
} from "./accounts-config";
import { EmptyResult, InlineAlert, ResultFrame, ResultRow } from "./accounts-shell";
import { Pagination } from "./pagination";
import { CompanyStatusChip, EntityMark, OwnershipStatusChip } from "./status-chip";

export const COMPANY_STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todas", value: "all" },
  { label: "Ativas", value: "active" },
  { label: "Suspensas", value: "suspended" },
  { label: "Em cadastro", value: "onboarding" },
  { label: "Arquivadas", value: "archived" },
];

function companiesHref(filters: AdminCompaniesFilters, overrides: Partial<AdminCompaniesFilters>) {
  const params = new URLSearchParams();
  params.set("tab", "empresas");

  const search = overrides.search ?? filters.search;
  const companyStatus = overrides.companyStatus ?? filters.companyStatus;
  const page = overrides.page ?? filters.page;

  if (search) params.set("search", search);
  if (companyStatus !== "all") params.set("companyStatus", companyStatus);
  if (page > 1) params.set("page", String(page));

  return `${ACCOUNTS_PATH}?${params.toString()}`;
}

export function CompaniesFilters({ filters }: { filters: AdminCompaniesFilters }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <form className="flex w-full max-w-xl items-end gap-2" method="get">
        <input name="tab" type="hidden" value="empresas" />
        {filters.companyStatus !== "all" ? (
          <input name="companyStatus" type="hidden" value={filters.companyStatus} />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label
            className="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
            htmlFor="companies-search"
          >
            <span className="flex h-4 items-center">Busca</span>
          </label>
          <input
            className={[
              "h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
              FOCUS_RING,
            ].join(" ")}
            defaultValue={filters.search}
            id="companies-search"
            name="search"
            placeholder="Razão social, nome fantasia ou CNPJ"
            type="search"
          />
        </div>
        <button
          className={[
            "h-11 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none",
            FOCUS_RING,
          ].join(" ")}
          type="submit"
        >
          Buscar
        </button>
      </form>

      <nav aria-label="Situação da empresa" className="flex flex-wrap gap-2">
        {COMPANY_STATUS_FILTERS.map((option) => {
          const isActive = filters.companyStatus === option.value;

          return (
            <Link
              aria-current={isActive ? "true" : undefined}
              className={[
                "border-2 border-[#1a1a1a] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition",
                FOCUS_RING,
                isActive
                  ? "bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                  : "bg-white text-[#1a1a1a] hover:bg-brand-yellow",
              ].join(" ")}
              href={companiesHref(filters, { companyStatus: option.value, page: 1 })}
              key={option.value}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function CompaniesList({
  filters,
  snapshot,
}: {
  filters: AdminCompaniesFilters;
  snapshot: AdminCompaniesSnapshot;
}) {
  // Erro de API não pode virar estado vazio: "nenhum registro" e "não consegui ler" levam o
  // administrador a conclusões opostas.
  if (snapshot.issues.length > 0) {
    return <InlineAlert tone="critical">{snapshot.issues.join(" · ")}</InlineAlert>;
  }

  if (snapshot.rows.length === 0) {
    return (
      <EmptyResult
        body="Empresas aparecem aqui assim que uma candidatura é aprovada."
        title="Nenhuma empresa neste recorte"
      />
    );
  }

  return (
    <ResultFrame
      footer={
        snapshot.totalPages > 1 ? (
          <Pagination
            currentPage={snapshot.currentPage}
            hrefFor={(page) => companiesHref(filters, { page })}
            totalPages={snapshot.totalPages}
          />
        ) : null
      }
      summary={`${snapshot.totalRows} empresa${snapshot.totalRows === 1 ? "" : "s"} neste recorte`}
    >
      {snapshot.rows.map((row) => (
        <ResultRow
          href={companyHref(row.id)}
          key={`company-${row.id}`}
          lead={
            <div className="flex items-center gap-3">
              <EntityMark kind="company" label="Empresa" />
              <div className="min-w-0">
                <p className="truncate font-black uppercase tracking-tight text-[#1a1a1a]">
                  {companyDisplayName(row)}
                </p>
                <p className="truncate font-mono text-xs text-[#231f20]/60">
                  {formatCnpj(row.cnpj)}
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
                {row.ownerUserId > 0 ? (
                  <Link
                    className={[
                      "relative z-10 inline-flex items-center gap-1.5 font-bold text-[#231f20] underline-offset-2 hover:underline",
                      FOCUS_RING,
                    ].join(" ")}
                    href={personHref(row.ownerUserId)}
                  >
                    <User aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                    <span className="truncate">{row.ownerName || `Usuário #${row.ownerUserId}`}</span>
                  </Link>
                ) : (
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/45">
                    sem titular
                  </p>
                )}
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
                  <span className="inline-flex items-center gap-1">
                    <Users aria-hidden className="h-3 w-3" strokeWidth={2.4} />
                    {row.activeMembers} ativo{row.activeMembers === 1 ? "" : "s"}
                  </span>
                  {row.pendingMembers > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[#c0392b]">
                      <TriangleAlert aria-hidden className="h-3 w-3" strokeWidth={2.4} />
                      {row.pendingMembers} pendente{row.pendingMembers === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          }
          trailing={
            <>
              <OwnershipStatusChip status={row.ownershipStatus} />
              <CompanyStatusChip status={row.companyStatus} />
            </>
          }
        />
      ))}
    </ResultFrame>
  );
}
