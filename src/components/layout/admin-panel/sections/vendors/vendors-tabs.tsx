import Link from "next/link";

import type {
  AdminVendorApplicationStatus,
  AdminVendorsFilters,
} from "@/lib/server/admin-vendors-filters";
import { buildAdminVendorsQuery } from "@/lib/server/admin-vendors-filters";
import type { AdminVendorsSummary } from "@/lib/server/admin-vendors";

type TabKey = AdminVendorApplicationStatus;

type Tab = {
  key: TabKey;
  label: string;
  count?: number;
};

export function VendorsTabs({
  filters,
  summary,
  totalRows,
}: {
  filters: AdminVendorsFilters;
  summary: AdminVendorsSummary;
  totalRows: number;
}) {
  const tabs: Tab[] = [
    {
      key: "all",
      label: "Todos",
      count: filters.status === "all" ? totalRows : undefined,
    },
    { key: "pending", label: "Pendentes", count: summary.pendingApplications },
    {
      key: "incomplete",
      label: "Cadastro incompleto",
      count: summary.incompleteApplications,
    },
    { key: "approved", label: "Aprovados", count: summary.approvedSellers },
    { key: "rejected", label: "Rejeitados" },
  ];

  return (
    <nav className="-mx-1 flex flex-wrap items-center gap-1" aria-label="Filtro de status">
      {tabs.map((tab) => {
        const isActive = filters.status === tab.key;
        const query = buildAdminVendorsQuery(filters, {
          status: tab.key,
          page: 1,
        });
        const href = query ? `?${query}` : "/admin/vendors";

        return (
          <Link
            key={tab.key}
            href={href}
            scroll={false}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
              isActive
                ? "border-[#231f20] bg-[#231f20] text-[#ffe500]"
                : "border-[#231f20]/14 bg-white text-[#231f20]/72 hover:border-[#231f20]/40 hover:text-[#231f20]",
            ].join(" ")}
            style={{ fontFamily: "var(--font-admin-mono)" }}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span
                className={[
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                  isActive ? "bg-[#ffe500] text-[#231f20]" : "bg-[#231f20]/10 text-[#231f20]/80",
                ].join(" ")}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
