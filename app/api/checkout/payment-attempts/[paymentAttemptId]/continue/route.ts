import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

const NO_STORE = { "Cache-Control": "no-store, private" };

/** Versão que a tentativa passa a esperar quando a configuração mudou; só texto é repassado. */
function staleVersion(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

type ContinueParams = { params: Promise<{ paymentAttemptId: string }> };

/**
 * Completa o pagamento Pagar.me de uma tentativa que aguarda dados, na mesma tentativa e pedido.
 * Só repassa `{ expectedCompanyId, configurationVersion, payment }`; o WordPress confere comprador,
 * empresa, versão e estado antes de cobrar, e retries não reemitem.
 */
export async function POST(request: Request, { params }: ContinueParams) {
  const session = await getServerSession(authOptions);
  const { paymentAttemptId } = await params;

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ code: "papelito_checkout_auth_required", message: "Faca login para concluir o pedido." }, { status: 401, headers: NO_STORE });
  }

  if (!/^\d{1,18}$/.test(paymentAttemptId)) {
    return NextResponse.json({ code: "papelito_payment_attempt_not_found", message: "Pagamento não encontrado." }, { status: 404, headers: NO_STORE });
  }

  const body: unknown = await request.json().catch(() => null);
  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const result = await wpRest<unknown>(`/papelito/v1/checkout/payment-attempts/${paymentAttemptId}/continue`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: {
      expectedCompanyId: record.expectedCompanyId,
      configurationVersion: record.configurationVersion,
      payment: record.payment,
    },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.error.code,
        message: result.error.message,
        orderId: result.error.data?.orderId,
        configurationVersion: staleVersion(result.error.data?.configurationVersion),
      },
      { status: result.status || 500, headers: NO_STORE },
    );
  }

  return NextResponse.json(result.data, { headers: NO_STORE });
}
