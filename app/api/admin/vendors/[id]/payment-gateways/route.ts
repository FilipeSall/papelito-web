import { NextResponse } from "next/server";

import { parseVendorPaymentSummary } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

const NO_STORE = { "Cache-Control": "no-store, private" };

type AdminVendorParams = { params: Promise<{ id: string }> };

/** Espelho administrativo da saúde dos gateways de um vendor (mesma projeção do painel). */
export async function GET(_request: Request, { params }: AdminVendorParams) {
  const auth = await getAdminApiSession();
  const { id } = await params;

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status, headers: NO_STORE });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Vendor inválido." }, { status: 400, headers: NO_STORE });
  }

  const result = await wpRest<unknown>(`/papelito/v1/admin/vendors/${id}/payment-gateways`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json({ code: result.error.code, message: result.error.message }, { status: result.status || 500, headers: NO_STORE });
  }

  const summary = parseVendorPaymentSummary(result.data);

  return summary
    ? NextResponse.json(summary, { headers: NO_STORE })
    : NextResponse.json({ code: "papelito_invalid_response", message: "Resposta inválida do servidor." }, { status: 502, headers: NO_STORE });
}
