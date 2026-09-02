import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { proxyExportDownload } from "@/lib/server/export-proxy";

export async function GET(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  return proxyExportDownload({
    accessToken: auth.accessToken,
    failureMessage: "Não foi possível exportar usuários.",
    path: "/papelito/v1/admin/reports/users/export",
    request,
  });
}
