import Link from "next/link";

import type { AdminUsersFilters } from "@/lib/server/admin-users-filters";
import { buildAdminUsersQuery } from "@/lib/server/admin-users-filters";

const TABS: Array<{ key: AdminUsersFilters["role"]; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "administrator", label: "Admins" },
  { key: "customer", label: "Customers" },
  { key: "seller", label: "Vendors" },
  { key: "other", label: "Outro" },
];

export function UsersTabs({
  filters,
  totalRows,
}: {
  filters: AdminUsersFilters;
  totalRows: number;
}) {
  return (
    <nav aria-label="Filtro de role" className="-mx-1 flex flex-wrap items-center gap-1">
      {TABS.map((tab) => {
        const isActive = filters.role === tab.key;
        const query = buildAdminUsersQuery(filters, { page: 1, role: tab.key });
        const href = query ? `?${query}` : "/admin/users";

        return (
          <Link
            key={tab.key}
            href={href}
            scroll={false}
            className={[
              "inline-flex items-center gap-2 border-2 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition",
              isActive
                ? "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow shadow-[3px_3px_0px_#ffe500]"
                : "border-[#1a1a1a] bg-white text-[#1a1a1a] hover:bg-brand-yellow",
            ].join(" ")}
          >
            <span>{tab.label}</span>
            {isActive ? (
              <span className="inline-flex min-w-6 items-center justify-center border border-brand-yellow px-1.5 py-0.5 text-[10px]">
                {totalRows}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
