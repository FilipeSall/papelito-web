import {
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

import { CardNotification } from "../../primitives";
import { SalesPresetLink } from "./sales-preset-link";

export function SalesFiltersPanel({
  filters,
  notifications = [],
}: {
  filters: ReturnType<typeof parseAdminSalesFilters>;
  notifications?: string[];
}) {
  const presetLinks: Array<{
    label: string;
    preset: "7d" | "30d" | "month" | "1y";
  }> = [
    { label: "7 dias", preset: "7d" },
    { label: "30 dias", preset: "30d" },
    { label: "Mês atual", preset: "month" },
    { label: "1 ano", preset: "1y" },
  ];

  return (
    <section className="animate-admin-panel-enter relative z-40 overflow-visible">
      <div className="flex flex-col gap-3 border-b border-[#231f20]/18 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#231f20]/64">
          <span>Papelito</span>
          <span aria-hidden className="text-[#231f20]/36">/</span>
          <span>Admin</span>
          <span aria-hidden className="text-[#231f20]/36">/</span>
          <span className="font-semibold text-[#231f20]">Vendas</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-[8px] bg-[#f7f2e7] px-3 py-2 text-sm font-semibold text-[#231f20]">
            janela ativa: {filters.periodLabel}
          </span>
          <CardNotification issues={notifications} />
        </div>
      </div>

      <div className="mt-4 rounded-[12px] border border-[#231f20]/16 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-1.5 xl:border-r xl:border-[#231f20]/14 xl:pr-4">
            {presetLinks.map((item) => (
              <SalesPresetLink
                key={item.preset}
                active={filters.preset === item.preset}
                href={`/admin/sales?${buildAdminSalesFilterQuery(filters, {
                  page: 1,
                  preset: item.preset,
                })}`}
                label={item.label}
              />
            ))}
          </div>

          <form
            key={`${filters.from}-${filters.to}-${filters.interval}`}
            className="relative z-40 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center xl:flex-1"
            method="get"
          >
            <input name="preset" type="hidden" value="custom" />
            <label className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#231f20]/72">de</span>
              <input
                className="min-h-9 w-full rounded-[8px] border border-[#231f20]/18 bg-white px-3 text-sm text-[#231f20] outline-none transition focus:border-[#231f20] md:w-36"
                defaultValue={filters.from}
                name="from"
                type="date"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#231f20]/72">até</span>
              <input
                className="min-h-9 w-full rounded-[8px] border border-[#231f20]/18 bg-white px-3 text-sm text-[#231f20] outline-none transition focus:border-[#231f20] md:w-36"
                defaultValue={filters.to}
                name="to"
                type="date"
              />
            </label>
            <span className="inline-flex min-h-9 items-center rounded-[8px] border border-[#231f20]/18 bg-[#f7f2e7] px-3 text-sm font-semibold text-[#231f20]/72">
              granularidade: {filters.interval === "day" ? "dia" : "mes"}
            </span>
            <button className="inline-flex min-h-9 items-center justify-center rounded-[8px] border border-[#231f20] bg-[#231f20] px-5 text-sm font-semibold text-[#ffe500] transition hover:bg-[#3a3536] md:ml-auto">
              aplicar filtro
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
