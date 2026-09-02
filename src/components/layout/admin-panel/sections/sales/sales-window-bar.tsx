import {
  buildAdminSalesFilterQuery,
  type parseAdminSalesFilters,
} from "@/lib/server/admin-sales-filters";

import { CardNotification, FOCUS_RING, HardPanel } from "../../primitives";
import { SalesPresetLink } from "./sales-preset-link";

const PRESET_LINKS: ReadonlyArray<{
  label: string;
  preset: "1y" | "30d" | "7d" | "month";
}> = [
  { label: "7 dias", preset: "7d" },
  { label: "30 dias", preset: "30d" },
  { label: "Mês atual", preset: "month" },
  { label: "1 ano", preset: "1y" },
];

const DATE_INPUT_CLASS = [
  "min-h-11 w-full rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold tabular-nums text-[#1a1a1a] md:w-40",
  FOCUS_RING,
].join(" ");

export function SalesWindowBar({
  filters,
  notifications = [],
}: {
  filters: ReturnType<typeof parseAdminSalesFilters>;
  notifications?: string[];
}) {
  return (
    <HardPanel accent="yellow" className="animate-admin-panel-enter overflow-visible">
      <div className="space-y-5 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav
              aria-label="Trilha de navegação"
              className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52"
            >
              <span>Papelito</span>
              <span aria-hidden>/</span>
              <span>Admin</span>
              <span aria-hidden>/</span>
              <span className="text-[#1a1a1a]">Vendas</span>
            </nav>
            <h2
              className="mt-3 text-[2.35rem] font-bold uppercase leading-none tracking-[-0.03em] text-[#1a1a1a]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Vendas do período
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#1a1a1a]/70">
              Um período governa a página inteira: os totais, os gráficos, a lista de pedidos e o
              ponto de partida das exportações.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="rounded-none border-2 border-[#1a1a1a] bg-white px-4 py-3 text-right shadow-[4px_4px_0px_#1a1a1a]">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/52">
                Janela ativa
              </p>
              <p
                className="mt-2 text-lg font-bold uppercase leading-none tabular-nums text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-admin-display)" }}
              >
                {filters.periodLabel}
              </p>
            </div>
            <CardNotification issues={notifications} />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t-2 border-dashed border-[#1a1a1a]/28 pt-4 xl:flex-row xl:items-end">
          <div className="flex flex-wrap gap-2">
            {PRESET_LINKS.map((item) => (
              <SalesPresetLink
                active={filters.preset === item.preset}
                href={`/admin/sales?${buildAdminSalesFilterQuery(filters, {
                  page: 1,
                  preset: item.preset,
                })}`}
                key={item.preset}
                label={item.label}
              />
            ))}
          </div>

          <form
            className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end xl:ml-auto"
            key={`${filters.from}-${filters.to}-${filters.interval}`}
            method="get"
          >
            <input name="preset" type="hidden" value="custom" />
            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                De
              </span>
              <input
                className={DATE_INPUT_CLASS}
                defaultValue={filters.from}
                name="from"
                type="date"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
                Até
              </span>
              <input
                className={DATE_INPUT_CLASS}
                defaultValue={filters.to}
                name="to"
                type="date"
              />
            </label>
            <button
              className={[
                "inline-flex min-h-11 items-center justify-center rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.16em] text-brand-yellow transition-colors hover:bg-[#000]",
                FOCUS_RING,
              ].join(" ")}
              type="submit"
            >
              Aplicar
            </button>
          </form>
        </div>
      </div>
    </HardPanel>
  );
}
