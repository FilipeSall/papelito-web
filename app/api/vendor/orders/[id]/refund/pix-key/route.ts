import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../../_lib/require-vendor-session";

export const dynamic = "force-dynamic";

type RefundPixKey = { holderName: string; key: string; type: string };

/**
 * Chave PIX do comprador para o estorno manual. O WordPress só a entrega ao
 * vendor do pedido com estorno manual pendente e registra cada leitura.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const result = await wpRest<RefundPixKey>(`/papelito/v1/vendor/me/orders/${id}/refund/pix-key`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
