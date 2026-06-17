import Link from "next/link";

import {
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

export function VendorPeriodFilters({
  basePath,
  filters,
}: {
  basePath: string;
  filters: ReturnType<typeof parseAdminSalesFilters>;
}) {
  const presets = [
    { label: "7 dias", preset: "7d" as const },
    { label: "30 dias", preset: "30d" as const },
    { label: "Mes atual", preset: "month" as const },
    { label: "1 ano", preset: "1y" as const },
  ];

  return (
    <div className="rounded-[14px] border border-brand-dark/15 bg-white/82 p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-wrap gap-2 xl:border-r xl:border-brand-dark/12 xl:pr-4">
          {presets.map((item) => (
            <Link
              className={`inline-flex min-h-9 items-center rounded-[8px] border px-4 text-sm font-semibold ${
                filters.preset === item.preset
                  ? "border-brand-yellow bg-brand-yellow"
                  : "border-brand-dark/18 bg-white hover:bg-[#f7f2e7]"
              }`}
              href={`${basePath}?${buildAdminSalesFilterQuery(filters, {
                page: 1,
                preset: item.preset,
              })}`}
              key={item.preset}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <form className="flex flex-col gap-3 md:flex-row md:items-center xl:flex-1" method="get">
          <input name="preset" type="hidden" value="custom" />
          <input
            className="min-h-9 rounded-[8px] border border-brand-dark/18 bg-white px-3 text-sm"
            defaultValue={filters.from}
            name="from"
            type="date"
          />
          <input
            className="min-h-9 rounded-[8px] border border-brand-dark/18 bg-white px-3 text-sm"
            defaultValue={filters.to}
            name="to"
            type="date"
          />
          <span className="inline-flex min-h-9 items-center rounded-[8px] border border-brand-dark/18 bg-[#f7f2e7] px-3 text-sm font-semibold text-brand-dark/72">
            granularidade: {filters.interval === "day" ? "dia" : "mes"}
          </span>
          <button className="min-h-9 rounded-[8px] bg-brand-dark px-5 text-sm font-semibold text-brand-yellow">
            Aplicar
          </button>
        </form>
      </div>
    </div>
  );
}
