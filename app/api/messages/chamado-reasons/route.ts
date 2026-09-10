import { NextResponse } from "next/server";

import type { WpChamadoReasonCatalog } from "@/features/chamados/services/chamado-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { requireMessageAccessToken } from "../_lib/require-message-session";

/** O vocabulário de motivos vive no PHP; o front lê em vez de duplicar. */
export async function GET() {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const result = await wpRest<WpChamadoReasonCatalog>("/papelito/v1/messages/chamado-reasons", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json(
        { code: result.error.code, message: result.error.message },
        { status: result.status || 502 },
      );
}
