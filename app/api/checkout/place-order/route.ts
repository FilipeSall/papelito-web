import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

type PlaceOrderApiResponse = {
  order_id?: number;
  order_number?: string;
  status?: string;
  payment?: {
    method?: "credit_card" | "pix" | "boleto";
    state?: string;
    pix?: {
      qr_code?: string;
      qr_code_url?: string;
      copy_paste?: string;
      expires_at?: string;
    };
    boleto?: {
      url?: string;
      line?: string;
      expires_at?: string;
    };
  };
  totals?: {
    subtotalCents?: number;
    discountCents?: number;
    itemsCents?: number;
    shippingCents?: number;
    totalCents?: number;
  };
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json(
      {
        code: "papelito_checkout_auth_required",
        message: "Faca login para concluir o pedido.",
      },
      { status: 401 },
    );
  }

  if (session.role !== "customer") {
    return NextResponse.json(
      {
        code: "papelito_checkout_customer_only",
        message: "Somente consumidores finais podem concluir o checkout.",
      },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const result = await wpRest<PlaceOrderApiResponse>(
    "/papelito/v1/checkout/place-order",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      json: payload,
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.error.code,
        message: result.error.message,
      },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({
    orderId: result.data.order_id,
    orderNumber: result.data.order_number,
    status: result.data.status,
    payment: result.data.payment,
    totals: result.data.totals,
  });
}
