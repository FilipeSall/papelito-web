import { MetricCard } from "../../primitives";

import type { AdminVendorsSummary } from "@/lib/server/admin-vendors";

export function VendorsMetrics({
  summary,
  totalRows,
}: {
  summary: AdminVendorsSummary;
  totalRows: number;
}) {
  const pending = summary.pendingApplications;
  const incomplete = summary.incompleteApplications;
  const approved = summary.approvedSellers;
  const coverage = summary.usersWithCoverage;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Triagens pendentes"
        value={String(pending).padStart(2, "0")}
        detail={
          pending > 0
            ? "Aguardando aprovacao do time"
            : "Nenhuma triagem aguardando"
        }
        tone={pending > 0 ? "warning" : "default"}
      />
      <MetricCard
        label="Cadastros incompletos"
        value={String(incomplete).padStart(2, "0")}
        detail="Entram no painel, mas nao podem vender"
        tone={incomplete > 0 ? "warning" : "default"}
      />
      <MetricCard
        label="Vendors aprovados"
        value={String(approved).padStart(2, "0")}
        detail="Vendendo no marketplace"
      />
      <MetricCard
        label="Com cobertura"
        value={String(coverage).padStart(2, "0")}
        detail="Vendors com faixa de CEP definida"
      />
      <MetricCard
        label="Total filtrado"
        value={String(totalRows).padStart(2, "0")}
        detail="Resultados visiveis no recorte atual"
      />
    </div>
  );
}
