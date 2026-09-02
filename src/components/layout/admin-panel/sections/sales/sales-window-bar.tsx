import { type parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

import { CardNotification, HardPanel } from "../../primitives";
import { SalesPeriodFilter } from "./sales-period-filter";

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

        <SalesPeriodFilter
          className="border-t-2 border-dashed border-[#1a1a1a]/28 pt-4"
          filters={filters}
        />
      </div>
    </HardPanel>
  );
}
