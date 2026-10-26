import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAdminReportOperations } from "@/lib/server/admin-report-operations";
import { getAdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";

import { HardPanel } from "../../primitives";
import { EXPORT_REPORTS, withCategoryChoice } from "./export-report-config";
import { ExportReportBlock } from "./export-report-block";
import { ProductImportPanel } from "./product-import-panel";
import { ReportsActivity } from "./reports-activity";

const ACTIVITY_SIZE = 6;

/**
 * Página de Relatórios do admin: as exportações que saíram do dashboard de Vendas, a do
 * catálogo de produtos no formato da importação, a importação de produtos novos por planilha e a
 * atividade recente.
 *
 * A atividade é lida sem cache a cada visita; o último lote sai da mesma leitura, que busca
 * mais itens do que a lista mostra para achar a importação mais recente entre exportações.
 */
export async function ReportsContent() {
  const session = await getServerSession(authOptions);
  const [operations, taxonomy] = session?.accessToken
    ? await Promise.all([getAdminReportOperations(session.accessToken, 20), getAdminTaxonomySnapshot(session.accessToken)])
    : [[], null];
  const categories = (taxonomy?.categories ?? []).filter((category) => category.isActive && !category.archivedAt);
  const products = withCategoryChoice(EXPORT_REPORTS.products, categories);
  const lastLot = operations.find((operation) => operation.kind === "import") ?? null;

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-[2rem] font-semibold uppercase leading-none tracking-[0.06em] text-[#1a1a1a] md:text-[2.4rem]" style={{ fontFamily: "var(--font-admin-display)" }}>
          Relatórios
        </h1>
        <p className="mt-2.5 max-w-[62ch] text-sm leading-6 text-[#231f20]/72">
          Exporte vendas, contas e o catálogo, e cadastre produtos novos por planilha.
        </p>
      </header>
      <div className="grid gap-7 pr-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] xl:items-start">
        <HardPanel accent="yellow">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-4 md:px-6">
            <div className="flex items-center gap-2">
              <span aria-hidden className="inline-block size-3 rotate-45 bg-brand-yellow" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]" id="reports-export">
                Exportar
              </h2>
            </div>
            <p className="text-xs text-[#231f20]/64">O número de cada relatório é o que sai no arquivo.</p>
          </div>
          <div className="divide-y-2 divide-[#1a1a1a]">
            <ExportReportBlock definition={EXPORT_REPORTS.sales} />
            <ExportReportBlock definition={EXPORT_REPORTS.users} />
            <ExportReportBlock definition={products} />
          </div>
        </HardPanel>
        <ProductImportPanel lastLot={lastLot} />
      </div>
      <ReportsActivity operations={operations.slice(0, ACTIVITY_SIZE)} />
    </div>
  );
}
