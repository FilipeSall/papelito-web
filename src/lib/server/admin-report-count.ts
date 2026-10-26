import "server-only";

import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ROLES = new Set(["all", "customer", "seller", "administrator"]);
const PRODUCT_STATUSES = new Set(["all", "publish", "draft"]);
const CATEGORY_SLUG = /^[a-z0-9-]{1,80}$/;

/** Relatório cuja contagem o painel consulta antes de exportar. */
export type ReportCountKind = "sales" | "users" | "products";

function productsQuery(url: URL): URLSearchParams | null {
  const status = url.searchParams.get("status") ?? "all";
  const category = url.searchParams.get("category") ?? "all";
  if (!PRODUCT_STATUSES.has(status) || !CATEGORY_SLUG.test(category)) return null;
  return new URLSearchParams({ category, status });
}

function reportQuery(url: URL, report: ReportCountKind): URLSearchParams | null {
  if (report === "products") return productsQuery(url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) return null;
  const query = new URLSearchParams({ from, to });
  if (report === "users") {
    const role = url.searchParams.get("role") ?? "all";
    if (!ROLES.has(role)) return null;
    query.set("role", role);
  }
  return query;
}

/**
 * Quantas linhas a exportação geraria no recorte, para o painel avisar "nada para exportar"
 * antes do download. A contagem é do WordPress, com o mesmo filtro da exportação; nada é cacheado.
 */
export async function proxyReportCount(request: Request, report: ReportCountKind) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status, headers: RESPONSE_HEADERS });
  }
  const query = reportQuery(new URL(request.url), report);
  if (!query) {
    return NextResponse.json({ message: "Filtro inválido." }, { status: 422, headers: RESPONSE_HEADERS });
  }
  const result = await wpRest<{ count?: unknown }>(`/papelito/v1/admin/reports/${report}/count?${query.toString()}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (!result.ok || !Number.isSafeInteger(result.data.count)) {
    const status = !result.ok && result.status >= 400 ? result.status : 502;
    return NextResponse.json({ message: "Não foi possível contar os registros do período." }, { status, headers: RESPONSE_HEADERS });
  }
  return NextResponse.json({ count: result.data.count }, { headers: RESPONSE_HEADERS });
}
