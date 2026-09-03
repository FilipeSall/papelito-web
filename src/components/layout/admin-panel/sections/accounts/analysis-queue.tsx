import Link from "next/link";
import { Building2, Store } from "lucide-react";

import type { AnalysisFilters, AnalysisSnapshot } from "@/lib/server/admin-analysis";

import { FOCUS_RING } from "../../primitives";

import { ACCOUNTS_PATH, formatDateTime } from "./accounts-config";
import { EmptyResult, InlineAlert, ResultFrame, ResultRow } from "./accounts-shell";
import { ApplicationStatusChip, EntityMark } from "./status-chip";

const TYPE_FILTERS: Array<{ label: string; value: AnalysisFilters["type"] }> = [
  { label: "Todas", value: "all" },
  { label: "Empresas", value: "company" },
  { label: "Vendors", value: "vendor" },
];

const STATUS_FILTERS: Array<{ label: string; value: AnalysisFilters["status"] }> = [
  { label: "Aguardando revisão", value: "pending_manual_review" },
  { label: "Aguardando documento", value: "document_required" },
  { label: "Aprovadas", value: "approved" },
  { label: "Reprovadas", value: "rejected" },
  { label: "Automáticas", value: "auto_approved" },
];

function filterHref(filters: AnalysisFilters, overrides: Partial<AnalysisFilters>) {
  const params = new URLSearchParams();
  params.set("tab", "analises");

  const type = overrides.type ?? filters.type;
  const status = overrides.status ?? filters.status;

  if (type !== "all") params.set("analysisType", type);
  if (status !== "pending_manual_review") params.set("analysisStatus", status);

  return `${ACCOUNTS_PATH}?${params.toString()}`;
}

function FilterLink({ href, isActive, label }: { href: string; isActive: boolean; label: string }) {
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
      href={href}
    >
      {label}
    </Link>
  );
}

export function AnalysisFiltersBar({ filters }: { filters: AnalysisFilters }) {
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Tipo de solicitação" className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((option) => (
          <FilterLink
            href={filterHref(filters, { type: option.value })}
            isActive={filters.type === option.value}
            key={option.value}
            label={option.label}
          />
        ))}
      </nav>

      {filters.type !== "vendor" ? (
        <nav aria-label="Situação da candidatura empresarial" className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <FilterLink
              href={filterHref(filters, { status: option.value })}
              isActive={filters.status === option.value}
              key={option.value}
              label={option.label}
            />
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function AnalysisQueue({ snapshot }: { snapshot: AnalysisSnapshot }) {
  if (snapshot.requests.length === 0) {
    return (
      <div className="space-y-4">
        {snapshot.issues.length > 0 ? (
          <InlineAlert tone="critical">{snapshot.issues.join(" · ")}</InlineAlert>
        ) : null}
        <EmptyResult
          body="Candidaturas de empresa e manifestações de interesse em ser vendor aparecem aqui assim que chegam."
          title="Nada aguardando análise"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {snapshot.issues.length > 0 ? (
        <InlineAlert tone="critical">{snapshot.issues.join(" · ")}</InlineAlert>
      ) : null}

      <ResultFrame
        summary={`${snapshot.requests.length} solicitaç${snapshot.requests.length === 1 ? "ão" : "ões"} neste recorte`}
      >
        {snapshot.requests.map((request) => (
          <ResultRow
            href={request.href}
            key={request.id}
            lead={
              <div className="flex items-center gap-3">
                <EntityMark
                  kind={request.kind === "vendor_interest" ? "vendor" : "company"}
                  label={request.kind === "vendor_interest" ? "Vendor" : "Empresa"}
                />
                <div className="min-w-0">
                  <p className="truncate font-black uppercase tracking-tight text-[#1a1a1a]">
                    {request.companyLabel}
                  </p>
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
                    {request.kind === "vendor_interest" ? (
                      <Store aria-hidden className="h-3 w-3" strokeWidth={2.4} />
                    ) : (
                      <Building2 aria-hidden className="h-3 w-3" strokeWidth={2.4} />
                    )}
                    {request.kindLabel}
                  </p>
                </div>
              </div>
            }
            meta={
              <div className="min-w-0">
                <p className="truncate font-bold text-[#231f20]">{request.requesterName}</p>
                <p className="truncate text-xs text-[#231f20]/58">{request.requesterEmail}</p>
              </div>
            }
            trailing={
              <>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/45">
                  {formatDateTime(request.createdAt)}
                </span>
                <ApplicationStatusChip status={request.status} />
              </>
            }
          />
        ))}
      </ResultFrame>
    </div>
  );
}
