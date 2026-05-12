import {
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

import { AdminSalesGranularitySelect } from "../../admin-sales-granularity-select";
import { CardNotification, Panel } from "../../primitives";
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
    interval?: "day" | "week" | "month";
  }> = [
    { label: "7 dias", preset: "7d", interval: "day" },
    { label: "30 dias", preset: "30d", interval: "day" },
    { label: "Mes atual", preset: "month", interval: "week" },
    { label: "1 ano", preset: "1y", interval: "month" },
  ];

  return (
    <Panel className="relative z-40 overflow-visible">
      <div className="flex items-center justify-between gap-3 rounded-t-[18px] border-b border-[#231f20]/10 bg-[#231f20] px-5 py-3 text-[#ffe500] md:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em]">
          Painel de vendas
        </p>
        <CardNotification issues={notifications} />
      </div>
      <div className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#231f20]/52">
              Papelito / Admin / Vendas
            </p>
            <h2
              className="mt-3 text-[2rem] font-semibold uppercase leading-none tracking-[0.08em] md:text-[2.6rem]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Visao geral
            </h2>
            <p className="mt-4 max-w-[68ch] text-sm leading-6 text-[#231f20]/74 md:text-[15px]">
              Acompanhe o desempenho comercial da loja em um so lugar. Escolha o periodo
              abaixo para atualizar simultaneamente os indicadores, os graficos e o historico
              de pedidos exibidos nas proximas secoes.
            </p>
          </div>
          <div className="rounded-[18px] border border-[#231f20]/12 bg-white/80 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              janela ativa
            </p>
            <p
              className="mt-2 text-lg font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-mono)" }}
            >
              {filters.periodLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {presetLinks.map((item) => (
            <SalesPresetLink
              key={item.preset}
              active={filters.preset === item.preset}
              href={`/admin/sales?${buildAdminSalesFilterQuery(filters, {
                page: 1,
                preset: item.preset,
                ...(item.interval ? { interval: item.interval } : {}),
              })}`}
              label={item.label}
            />
          ))}
        </div>

        <form
          key={`${filters.from}-${filters.to}-${filters.interval}`}
          className="relative z-40 grid gap-3 xl:grid-cols-[1fr_1fr_0.8fr_auto]"
          method="get"
        >
          <input name="preset" type="hidden" value="custom" />
          <label className="space-y-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              de
            </span>
            <input
              className="min-h-11 w-full rounded-[14px] border border-[#231f20]/14 bg-white px-4 text-sm text-[#231f20] outline-none transition focus:border-[#231f20]"
              defaultValue={filters.from}
              name="from"
              type="date"
            />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              ate
            </span>
            <input
              className="min-h-11 w-full rounded-[14px] border border-[#231f20]/14 bg-white px-4 text-sm text-[#231f20] outline-none transition focus:border-[#231f20]"
              defaultValue={filters.to}
              name="to"
              type="date"
            />
          </label>
          <AdminSalesGranularitySelect
            key={`granularity-${filters.interval}`}
            defaultValue={filters.interval}
          />
          <button className="inline-flex min-h-11 items-center justify-center self-end rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-5 text-sm font-semibold uppercase tracking-[0.16em] text-[#ffe500]">
            aplicar filtro
          </button>
        </form>
      </div>
    </Panel>
  );
}
