import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

/**
 * Registro do estorno manual pela Papelito, quando o vendor não registrou. Exige
 * justificativa e usa comprovante já enviado pelo vendor do pedido.
 */
export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { orderId } = await params;

  if (!/^\d+$/.test(orderId)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const exceptionReason = typeof body?.exceptionReason === "string" ? body.exceptionReason.trim() : "";
  const proofId = Number(body?.proofId);

  if (exceptionReason === "" || !Number.isInteger(proofId) || proofId <= 0) {
    return NextResponse.json({ message: "Informe a justificativa e o comprovante." }, { status: 422 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/admin/order-refunds/${orderId}/manual`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: {
      exceptionReason,
      notes: typeof body?.notes === "string" ? body.notes.trim() : "",
      proofId,
      reference: typeof body?.reference === "string" ? body.reference.trim() : "",
      refundedAt: typeof body?.refundedAt === "string" ? body.refundedAt : "",
    },
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-orders", "max");
  revalidatePath(`/vendor/pedidos/${orderId}`);
  revalidatePath(`/perfil/pedidos/${orderId}`);

  return NextResponse.json(result.data);
}
