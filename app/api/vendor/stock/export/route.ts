import { NextResponse } from "next/server";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";
import { proxyExportDownload } from "@/lib/server/export-proxy";

/**
 * Baixa a planilha de estoque do vendor (SKU Papelito, código SKU, produto e quantidade).
 * `?format=csv` troca o XLSX por CSV; o WordPress monta o arquivo e o Next só repassa o stream.
 */
export async function GET(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  return proxyExportDownload({
    accessToken: auth.accessToken,
    failureMessage: "Não foi possível exportar seu estoque.",
    path: "/papelito/v1/vendor/me/stock/export",
    request,
  });
}
