import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import type { WpMessageThread } from "@/features/messages/services/message-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { requireMessageAccessToken } from "../_lib/require-message-session";

export async function POST(request: Request) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = typeof body?.orderId === "number" ? body.orderId : Number(body?.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 422 });
  }

  const result = await wpRest<WpMessageThread>(
    `/papelito/v1/messages/orders/${orderId}/return-support`,
    { headers: { Authorization: `Bearer ${auth.accessToken}` }, method: "POST" },
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath(`/perfil/pedidos/${orderId}/suporte`);
  revalidatePath(`/perfil/pedidos/${orderId}`);
  revalidatePath("/vendor/mensagens");
  revalidateTag("vendor-messages", "max");
  return NextResponse.json(result.data, { status: result.status });
}
