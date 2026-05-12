import { BarChartPlaceholder } from "../charts";
import { FLASH_SALE_ROWS } from "../mock-data";
import {
  CompactTable,
  EmptyStateCard,
  FilterBar,
  Panel,
} from "../primitives";
import { ModalPreview } from "../previews";

export function FlashSaleContent() {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-5" tone="dark">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/56">
            campanha ativa
          </p>
          <h3
            className="mt-3 text-[2.3rem] font-semibold uppercase leading-none tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Giro hemp week
          </h3>
          <p className="mt-4 max-w-[40ch] text-sm leading-6 text-white/82">
            Labels, supporting text, janela ativa e grade de produtos preparados com mock data para
            depois plugar o dominio `papelito/v1`.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "starts", value: "08/05 10:00" },
              { label: "ends", value: "10/05 23:59" },
              { label: "label", value: "flash bundle" },
            ].map((item) => (
              <div key={item.label} className="rounded-[16px] border border-white/12 bg-white/6 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-sm font-semibold uppercase tracking-[0.08em]"
                  style={{ fontFamily: "var(--font-admin-mono)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="p-5">
          <BarChartPlaceholder label="janela / pressao promocional" />
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-[#231f20]/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              grade de produtos
            </p>
            <p className="mt-1 text-sm text-[#231f20]/64">Tabela mockada para associacao da campanha.</p>
          </div>
          <FilterBar items={["Ativos", "Candidatos", "Margem", "Categoria"]} />
        </div>
        <CompactTable
          headers={["produto", "sku", "preco base", "preco promo", "status"]}
          rows={FLASH_SALE_ROWS}
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <ModalPreview />
        <EmptyStateCard
          label="slot"
          title="Sem campanha secundaria"
          body="O v1 assume uma campanha ativa por vez. Este estado vazio deixa claro quando o segundo slot ainda nao existe."
        />
      </div>
    </>
  );
}
