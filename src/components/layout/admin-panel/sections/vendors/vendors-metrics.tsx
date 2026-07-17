import type { AdminVendorsSummary } from "@/lib/server/admin-vendors";
import { MetricCard } from "../../primitives";

export function VendorsMetrics({
  summary,
  totalRows,
}: {
  summary: AdminVendorsSummary;
  totalRows: number;
}) {
  const withoutCoverage = Math.max(0, summary.totalVendors - summary.usersWithCoverage);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        detail="Contas com papel de vendor"
        label="Total de vendors"
        value={String(totalRows).padStart(2, "0")}
      />
      <MetricCard
        detail="Vendors com faixa de CEP definida"
        label="Com cobertura"
        value={String(summary.usersWithCoverage).padStart(2, "0")}
      />
      <MetricCard
        detail="Precisam configurar a área de atendimento"
        label="Sem cobertura"
        tone={withoutCoverage > 0 ? "warning" : "default"}
        value={String(withoutCoverage).padStart(2, "0")}
      />
    </div>
  );
}
