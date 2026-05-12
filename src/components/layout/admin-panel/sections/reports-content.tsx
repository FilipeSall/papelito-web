import { DonutChartPlaceholder } from "../charts";
import { REPORT_ROWS } from "../mock-data";
import {
  CompactTable,
  EmptyStateCard,
  FilterBar,
  LoadingStateCard,
  Panel,
} from "../primitives";

export function ReportsContent() {
  return (
    <>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <FilterBar items={["Todos", "Clientes", "Operacao", "XLSX", "Versionados"]} />
        <button className="inline-flex min-h-11 items-center rounded-[14px] border-2 border-[#231f20] bg-[#231f20] px-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#ffe500]">
          Novo preset
        </button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-[#231f20]/10 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              catalogo de relatorios
            </p>
          </div>
          <CompactTable
            headers={["relatorio", "area", "saida", "status", "nota"]}
            rows={REPORT_ROWS}
          />
        </Panel>
        <Panel className="p-5">
          <DonutChartPlaceholder />
        </Panel>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <LoadingStateCard />
        <EmptyStateCard
          label="sql"
          title="Sem consulta custom aprovada"
          body="Estado pronto para quando o catalogo ainda nao tiver uma query liberada para exportacao versionada."
        />
      </div>
    </>
  );
}
