import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { WpChamado } from "@/features/chamados/services/chamado-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { revalidateChamados } from "../_lib/revalidate-chamados";
import { requireMessageAccessToken } from "../_lib/require-message-session";

export async function POST(request: Request) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as
    | { orderId?: unknown; reason?: unknown; reasonOther?: unknown }
    | null;
  const orderId = typeof body?.orderId === "number" ? body.orderId : Number(body?.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 422 });
  }

  // Sem motivo não se abre devolução. O WordPress valida de novo — este é o atalho, não a regra.
  if (typeof body?.reason !== "string" || body.reason.trim() === "") {
    return NextResponse.json(
      { code: "papelito_return_reason_invalid", message: "Informe um motivo para a devolução." },
      { status: 422 },
    );
  }

  const result = await wpRest<WpChamado>(
    `/papelito/v1/messages/orders/${orderId}/return-support`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: { reason: body.reason, reasonOther: body.reasonOther },
      method: "POST",
    },
  );
  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath(`/perfil/pedidos/${orderId}`);
  revalidateChamados(result.data.thread_id as number | undefined);
  return NextResponse.json(result.data, { status: result.status });
}
