import { LineChartPlaceholder } from "../charts";
import { KPI_CARDS, RECENT_ORDER_ROWS } from "../mock-data";
import {
  CompactTable,
  EmptyStateCard,
  FilterBar,
  LoadingStateCard,
  MetricCard,
  Panel,
  StatusBadge,
} from "../primitives";
import { ModalPreview } from "../previews";

export function OverviewContent() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <Panel className="p-5">
          <LineChartPlaceholder label="receita por janela" />
        </Panel>
        <Panel className="p-5" tone="dark">
          <div className="flex items-center justify-between gap-3">
            <h3
              className="text-xl font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Alertas da operacao
            </h3>
            <StatusBadge label="09 open" />
          </div>
          <div className="mt-5 space-y-3">
            {[
              "Filtro Bio abaixo do buffer ideal em 2 CDs",
              "Campanha relampago vence em 11h 24m",
              "Exportacao de sellers aguardando confirmacao",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[16px] border border-white/12 bg-white/6 px-4 py-3 text-sm leading-6 text-white/86"
              >
                {item}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-[#231f20]/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
                pedidos recentes
              </p>
              <p className="mt-1 text-sm text-[#231f20]/66">Tabela densa pronta para filtros.</p>
            </div>
            <FilterBar items={["Hoje", "Aprovados", "Expedicao"]} />
          </div>
          <CompactTable
            headers={["pedido", "cesta", "status", "valor", "hora"]}
            rows={RECENT_ORDER_ROWS}
          />
        </Panel>

        <Panel className="p-5">
          <div className="rounded-[18px] border border-[#231f20]/12 bg-[#231f20] p-4 text-[#f5f1e8]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/56">
              oferta relampago
            </p>
            <p
              className="mt-3 text-2xl font-semibold uppercase tracking-[0.08em]"
              style={{ fontFamily: "var(--font-admin-display)" }}
            >
              Giro hemp week
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["starts 10:00", "ends 23:59", "08 SKUs"].map((item) => (
                <div key={item} className="rounded-[14px] border border-white/12 bg-white/6 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/84">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[18px] border border-[#231f20]/12 bg-white/82 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
              fila vendors
            </p>
            <div className="mt-4 space-y-3">
              {[
                ["Headshop Centro", "review"],
                ["Tabacaria Norte", "queued"],
                ["Boutique Rua 9", "approved"],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[14px] border border-[#231f20]/10 px-3 py-3">
                  <span className="text-sm text-[#231f20]/74">{label}</span>
                  <StatusBadge label={status} />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <LoadingStateCard />
        <EmptyStateCard
          label="empty"
          title="Sem segundo slot de campanha"
          body="Estado vazio pronto para quando ainda nao existir campanha secundaria, aprovacao ou nova biblioteca de banners."
        />
        <ModalPreview />
      </div>
    </>
  );
}
