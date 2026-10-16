import { NextResponse } from "next/server";

import { parseVendorPaymentSummary } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

const NO_STORE = { "Cache-Control": "no-store, private" };

type AdminVendorParams = { params: Promise<{ id: string }> };

/**
 * Registra a conferência administrativa de titularidade da conta Mercado Pago do vendor
 * (`verified` ou `mismatch`), com referência curta da evidência — nunca o documento. O `accountId`
 * é a conta que o admin viu; se o vendor reconectou outra no meio, o WordPress responde 409.
 */
export async function POST(request: Request, { params }: AdminVendorParams) {
  const auth = await getAdminApiSession();
  const { id } = await params;

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status, headers: NO_STORE });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Vendor inválido." }, { status: 400, headers: NO_STORE });
  }

  const body: unknown = await request.json().catch(() => null);
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const result = await wpRest<unknown>(`/papelito/v1/admin/vendors/${id}/mercadopago/identity`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { status: record.status, evidenceRef: record.evidenceRef, accountId: record.accountId },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json({ code: result.error.code, message: result.error.message }, { status: result.status || 500, headers: NO_STORE });
  }

  return NextResponse.json(parseVendorPaymentSummary(result.data) ?? {}, { headers: NO_STORE });
}
