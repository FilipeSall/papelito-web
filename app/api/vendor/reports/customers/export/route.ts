import { NextResponse } from "next/server";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";
import { proxyExportDownload } from "@/lib/server/export-proxy";

export async function GET(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  return proxyExportDownload({
    accessToken: auth.accessToken,
    failureMessage: "Não foi possível exportar seus clientes.",
    path: "/papelito/v1/vendor/me/reports/customers/export",
    request,
  });
}
