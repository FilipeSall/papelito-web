import { proxyReportCount } from "@/lib/server/admin-report-count";

/** Pedidos pagos que a exportação de vendas geraria no período. */
export function GET(request: Request) {
  return proxyReportCount(request, "sales");
}
