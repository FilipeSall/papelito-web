import Link from "next/link";

import type { AdminUserRow, AdminUsersSnapshot } from "@/lib/server/admin-users";
import type { AdminUsersFilters } from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

import { CompactTable, EmptyStateCard, Panel } from "../../primitives";

import { UserRoleBadge, UserStatusBadge } from "./user-badges";

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

function detailHref(row: AdminUserRow, filters: AdminUsersFilters) {
  const params = new URLSearchParams();

  if (filters.page > 1) {
    params.set("originPage", String(filters.page));
  }
  if (filters.search) {
    params.set("originSearch", filters.search);
  }
  if (filters.role !== "all") {
    params.set("originRole", filters.role);
  }

  return params.toString() ? `/admin/users/${row.id}?${params.toString()}` : `/admin/users/${row.id}`;
}

function PaginationLink({
  ariaLabel,
  children,
  disabled,
  filters,
  page,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  disabled: boolean;
  filters: AdminUsersFilters;
  page: number;
}) {
  const query = buildAdminUsersQuery(filters, { page });
  const href = query ? `?${query}` : "/admin/users";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex h-9 min-w-9 cursor-not-allowed items-center justify-center border-2 border-[#1a1a1a]/18 px-3 text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a]/32"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      aria-label={ariaLabel}
      className="inline-flex h-9 min-w-9 items-center justify-center border-2 border-[#1a1a1a] bg-white px-3 text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a] transition hover:bg-brand-yellow"
      href={href}
      scroll={false}
    >
      {children}
    </Link>
  );
}

export function UsersList({
  filters,
  snapshot,
}: {
  filters: AdminUsersFilters;
  snapshot: AdminUsersSnapshot;
}) {
  if (snapshot.rows.length === 0) {
    if (snapshot.issues.length > 0) {
      return (
        <Panel className="rounded-none px-5 py-4 text-sm leading-6 text-[#7a3428]">
          {snapshot.issues.join(" • ")}
        </Panel>
      );
    }

    return (
      <EmptyStateCard
        body="Ajuste busca ou filtro de role para encontrar outras contas."
        label="Sem dados"
        title="Nenhum usuario encontrado"
      />
    );
  }

  const rows = snapshot.rows.map((row) => {
    const href = detailHref(row, filters);

    return [
      <div key={`user-${row.id}`} className="space-y-1">
        <Link className="block font-semibold text-[#231f20] hover:underline" href={href}>
          {row.name || row.email || `Usuario #${row.id}`}
        </Link>
        <p className="text-xs text-[#231f20]/58">{row.email}</p>
      </div>,
      <div key={`role-${row.id}`} className="space-y-2">
        <UserRoleBadge label={row.roleLabel || "Outro"} />
        {row.isVendor ? (
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/52">
            historico vendor
          </p>
        ) : null}
      </div>,
      <UserStatusBadge key={`status-${row.id}`} label={row.accountStatusLabel || "Ativa"} />,
      <div key={`volume-${row.id}`} className="space-y-1 text-xs uppercase tracking-[0.12em] text-[#231f20]/66">
        <p>pedidos {row.ordersCount}</p>
        <p>vendas {row.salesCount}</p>
        <p>fav {row.favoritesCount} • tickets {row.supportTicketsCount}</p>
      </div>,
      <span key={`time-${row.id}`} className="text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
        {formatRegisteredAgo(row.registeredAt)}
      </span>,
      <Link
        key={`open-${row.id}`}
        className="inline-flex items-center border-2 border-[#1a1a1a] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow"
        href={href}
      >
        Analisar
      </Link>,
    ];
  });

  return (
    <div className="space-y-3">
      <Panel className="overflow-hidden rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="border-b-2 border-[#1a1a1a] bg-[#faf8f2] px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/48">
            base administrativa de usuarios
          </p>
        </div>
        <CompactTable
          headers={["usuario", "role", "status", "volume", "registro", ""]}
          rows={rows}
        />
      </Panel>

      {snapshot.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 px-1 text-xs uppercase tracking-[0.12em] text-[#231f20]/56">
          <span>
            pagina {snapshot.currentPage} de {snapshot.totalPages} — {snapshot.totalRows} registros
          </span>
          <div className="flex items-center gap-2">
            <PaginationLink
              ariaLabel="Pagina anterior"
              disabled={snapshot.currentPage <= 1}
              filters={filters}
              page={snapshot.currentPage - 1}
            >
              {"<"}
            </PaginationLink>
            <PaginationLink
              ariaLabel="Proxima pagina"
              disabled={snapshot.currentPage >= snapshot.totalPages}
              filters={filters}
              page={snapshot.currentPage + 1}
            >
              {">"}
            </PaginationLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}
