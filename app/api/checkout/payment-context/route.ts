import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { parsePaymentContext } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

const NO_STORE = { "Cache-Control": "no-store, private" };

const LEGACY_PAGARME_CONTEXT = { provider: "pagarme", flow: "direct", configurationVersion: "", fallbackReason: "" } as const;

/**
 * Gateway e fluxo que o backend usará para o carrinho, sem criar pedido nem cobrança.
 * O vendor é resolvido no WordPress a partir dos itens, nunca deste payload.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ code: "papelito_checkout_auth_required", message: "Faca login para concluir o pedido." }, { status: 401, headers: NO_STORE });
  }

  const payload: unknown = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400, headers: NO_STORE });
  }

  const result = await wpRest<unknown>("/papelito/v1/checkout/payment-context", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: payload,
    cache: "no-store",
  });

  if (!result.ok && result.status === 404 && result.error.code === "rest_no_route") {
    return NextResponse.json(LEGACY_PAGARME_CONTEXT, { headers: NO_STORE });
  }

  if (!result.ok) {
    return NextResponse.json({ code: result.error.code, message: result.error.message }, { status: result.status || 500, headers: NO_STORE });
  }

  const context = parsePaymentContext(result.data);

  if (!context) {
    return NextResponse.json({ code: "papelito_invalid_response", message: "Resposta inválida do servidor." }, { status: 502, headers: NO_STORE });
  }

  return NextResponse.json(context, { headers: NO_STORE });
}
