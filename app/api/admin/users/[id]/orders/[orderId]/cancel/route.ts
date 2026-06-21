import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = {
  params: Promise<{ id: string; orderId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const body = (await request.json().catch(() => null)) as { reason?: string } | null;
  const { id, orderId } = await context.params;
  const userId = Number.parseInt(id, 10);
  const parsedOrderId = Number.parseInt(orderId, 10);

  if (!Number.isFinite(userId) || userId <= 0 || !Number.isFinite(parsedOrderId) || parsedOrderId <= 0) {
    return NextResponse.json({ message: "Parametros invalidos." }, { status: 400 });
  }

  if (!body?.reason || typeof body.reason !== "string") {
    return NextResponse.json({ message: "Informe o motivo do cancelamento." }, { status: 400 });
  }

  const result = await wpRest<unknown>(
    `/papelito/v1/admin/users/${userId}/orders/${parsedOrderId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      json: { reason: body.reason },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao cancelar o pedido." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
