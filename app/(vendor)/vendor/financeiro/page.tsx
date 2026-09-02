import { redirect } from "next/navigation";

/**
 * Financeiro foi absorvido pelo dashboard: era um subconjunto estrito dele,
 * com os mesmos KPIs e o mesmo gráfico. A rota fica só para não quebrar link salvo.
 */
export default function VendorFinancePage() {
  redirect("/vendor/dashboard");
}
