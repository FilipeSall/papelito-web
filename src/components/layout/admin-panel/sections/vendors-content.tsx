import { LineChartPlaceholder } from "../charts";
import { VENDOR_ROWS } from "../mock-data";
import {
  CompactTable,
  LoadingStateCard,
  MetricCard,
  Panel,
} from "../primitives";

export function VendorsContent() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Fila aberta", value: "19", detail: "07 aguardando leitura", tone: "warning" as const },
          { label: "Aprovados no dia", value: "06", detail: "Pico em Curitiba e Goiania", tone: "default" as const },
          { label: "Faixas CEP", value: "31", detail: "08 em revisao de cobertura", tone: "default" as const },
          { label: "Risco de overlap", value: "02", detail: "Faixas precisam merge", tone: "warning" as const },
        ].map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      <Panel className="overflow-hidden">
        <div className="border-b border-[#231f20]/10 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
            triagem de vendors
          </p>
        </div>
        <CompactTable
          headers={["vendor", "cidade", "status", "espera", "faixa"]}
          rows={VENDOR_ROWS}
        />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel className="p-5">
          <LineChartPlaceholder label="cobertura / cep map" />
        </Panel>
        <LoadingStateCard />
      </div>
    </>
  );
}
