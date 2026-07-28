import Link from "next/link";

import { CompactTable, EmptyStateCard, Panel } from "../../primitives";

import type { AdminVendorsFilters } from "@/lib/server/admin-vendors-filters";
import { buildAdminVendorsQuery } from "@/lib/server/admin-vendors-filters";
import type { AdminVendorRow, AdminVendorsSnapshot } from "@/lib/server/admin-vendors";

function formatLocation(row: AdminVendorRow) {
  const city = row.city.trim();
  const state = row.state.trim();
  if (city && state) return `${city} / ${state}`;
  return city || state || "—";
}

function formatRegisteredAgo(value: string) {
  if (!value) return "—";

  const parsed = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(parsed.getTime())) return "—";

  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return "agora";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}m`;
}

function PaginationLink({
  filters,
  page,
  disabled,
  children,
  ariaLabel,
}: {
  filters: AdminVendorsFilters;
  page: number;
  disabled: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  const query = buildAdminVendorsQuery(filters, { page });
  const href = query ? `?${query}` : "/admin/vendors";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-9 min-w-9 cursor-not-allowed items-center justify-center rounded-lg border border-[#231f20]/14 px-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#231f20]/30"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      aria-label={ariaLabel}
      href={href}
      scroll={false}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#231f20]/14 bg-white px-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#231f20] transition hover:border-[#231f20]/40"
    >
      {children}
    </Link>
  );
}

export function VendorsList({
  filters,
  snapshot,
}: {
  filters: AdminVendorsFilters;
  snapshot: AdminVendorsSnapshot;
}) {
  if (snapshot.rows.length === 0) {
    const empty = {
      label: "Sem dados",
      title: "Nenhum vendor encontrado",
      body: filters.search
        ? "Tente outro termo de busca."
        : "Use Novo vendor para criar uma conta ou promover um customer.",
    };

    if (snapshot.issues.length > 0) {
      return (
        <Panel className="px-5 py-4 text-sm leading-6 text-[#7a3428]">
          {snapshot.issues.join(" • ")}
        </Panel>
      );
    }

    return <EmptyStateCard label={empty.label} title={empty.title} body={empty.body} />;
  }

  const rows = snapshot.rows.map((row) => {
    const params = new URLSearchParams();
    if (filters.page > 1) {
      params.set("originPage", String(filters.page));
    }
    if (filters.search) {
      params.set("originSearch", filters.search);
    }
    const detailHref = params.toString()
      ? `/admin/vendors/${row.id}?${params.toString()}`
      : `/admin/vendors/${row.id}`;

    return [
      <Link
        key={`name-${row.id}`}
        href={detailHref}
        className="block font-semibold text-[#231f20] hover:underline"
      >
        {row.storeName || row.name || row.email || `Vendor #${row.id}`}
      </Link>,
      <span key={`location-${row.id}`} className="text-[#231f20]/68">
        {formatLocation(row)}
      </span>,
      <span key={`cnpj-${row.id}`} className="font-mono text-xs text-[#231f20]/68">
        {row.cnpj || "—"}
      </span>,
      <span key={`coverage-${row.id}`} className="text-xs text-[#231f20]/68">
        {row.coverageSummary || "Sem cobertura"}
      </span>,
      <span key={`time-${row.id}`} className="text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
        {formatRegisteredAgo(row.registeredAt)}
      </span>,
      <Link
        key={`open-${row.id}`}
        href={detailHref}
        className="inline-flex items-center rounded-full border border-[#231f20]/24 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#231f20] transition hover:border-[#231f20]"
      >
        Abrir
      </Link>,
    ];
  });

  return (
    <div className="space-y-3">
      <Panel className="overflow-hidden">
        <div className="border-b border-[#231f20]/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            vendors cadastrados
          </p>
        </div>
        <CompactTable
          headers={["vendor", "cidade", "cnpj", "cobertura", "registro", ""]}
          rows={rows}
        />
      </Panel>
      {snapshot.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 px-1 text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
          <span>
            página {snapshot.currentPage} de {snapshot.totalPages} —{" "}
            {snapshot.totalRows} registros
          </span>
          <div className="flex items-center gap-2">
            <PaginationLink
              filters={filters}
              page={snapshot.currentPage - 1}
              disabled={snapshot.currentPage <= 1}
              ariaLabel="Página anterior"
            >
              {"<"}
            </PaginationLink>
            <PaginationLink
              filters={filters}
              page={snapshot.currentPage + 1}
              disabled={snapshot.currentPage >= snapshot.totalPages}
              ariaLabel="Próxima página"
            >
              {">"}
            </PaginationLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
