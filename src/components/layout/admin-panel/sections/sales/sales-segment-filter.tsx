import {
  ADMIN_SALES_SEGMENTS,
  ADMIN_SALES_SEGMENT_LABELS,
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

import { FOCUS_RING, HardPanel } from "../../primitives";

const SEGMENT_HINTS: Record<(typeof ADMIN_SALES_SEGMENTS)[number], string> = {
  all: "Pedidos com pagamento confirmado no período.",
  discounted: "Pedidos pagos que tiveram desconto em dinheiro.",
  refunded: "Pedidos reembolsados ou cancelados.",
};

export function SalesSegmentFilter({
  basePath = "/admin/sales",
  filters,
}: Readonly<{
  basePath?: string;
  filters: ReturnType<typeof parseAdminSalesFilters>;
}>) {
  return (
    <HardPanel accent="none" tone="muted">
      <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/62">
            Tipo de venda
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#1a1a1a]/72">
            {SEGMENT_HINTS[filters.segment]}
          </p>
        </div>

        <nav aria-label="Tipo de venda" className="flex flex-wrap gap-2">
          {ADMIN_SALES_SEGMENTS.map((segment) => {
            const active = filters.segment === segment;

            return (
              <a
                aria-current={active ? "true" : undefined}
                className={[
                  "inline-flex min-h-11 items-center rounded-none border-2 border-[#1a1a1a] px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-colors",
                  active
                    ? "bg-brand-yellow text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
                    : "bg-white text-[#1a1a1a] hover:bg-[#f7f2e7]",
                  FOCUS_RING,
                ].join(" ")}
                href={`${basePath}?${buildAdminSalesFilterQuery(filters, {
                  page: 1,
                  segment,
                })}`}
                key={segment}
              >
                {ADMIN_SALES_SEGMENT_LABELS[segment]}
              </a>
            );
          })}
        </nav>
      </div>
    </HardPanel>
  );
}
