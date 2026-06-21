import type { AdminUsersSummary } from "@/lib/server/admin-users";

import { MetricCard } from "../../primitives";

export function UsersMetrics({
  summary,
  totalRows,
}: {
  summary: AdminUsersSummary;
  totalRows: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        detail="Resultados visiveis no recorte atual"
        label="Total filtrado"
        value={String(totalRows).padStart(2, "0")}
      />
      <MetricCard
        detail="Contas com permissao de manage_options"
        label="Admins"
        value={String(summary.adminsCount).padStart(2, "0")}
      />
      <MetricCard
        detail="Operacao de vendor ativa ou com cobertura consolidada"
        label="Vendors"
        value={String(summary.sellersCount).padStart(2, "0")}
      />
      <MetricCard
        detail="Base de compra / contas nao vendedoras"
        label="Customers"
        value={String(summary.customersCount).padStart(2, "0")}
      />
      <MetricCard
        detail="Roles fora do mapeamento principal"
        label="Outro"
        value={String(summary.othersCount).padStart(2, "0")}
        tone={summary.othersCount > 0 ? "warning" : "default"}
      />
    </div>
  );
}
