import { HardPanel } from "@/components/layout/admin-panel/primitives";
import { SalesPeriodFilter } from "@/components/layout/admin-panel/sections/sales/sales-period-filter";
import { type parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

export function VendorPeriodFilters({
  basePath,
  filters,
}: Readonly<{
  basePath: string;
  filters: ReturnType<typeof parseAdminSalesFilters>;
}>) {
  return (
    <HardPanel accent="yellow" className="animate-admin-panel-enter overflow-visible">
      <div className="flex flex-col gap-4 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/62">
            Período
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
            Janela ativa:{" "}
            <span className="tabular-nums text-[#1a1a1a]">{filters.periodLabel}</span>
          </p>
        </div>

        <SalesPeriodFilter basePath={basePath} filters={filters} />
      </div>
    </HardPanel>
  );
}
