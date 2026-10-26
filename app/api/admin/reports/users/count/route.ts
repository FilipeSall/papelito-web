import { proxyReportCount } from "@/lib/server/admin-report-count";

/** Contas que a exportação de usuários geraria no período de cadastro e papel. */
export function GET(request: Request) {
  return proxyReportCount(request, "users");
}
