import { proxyReportCount } from "@/lib/server/admin-report-count";

/** Produtos do catálogo que a exportação geraria na situação e categoria escolhidas. */
export function GET(request: Request) {
  return proxyReportCount(request, "products");
}
