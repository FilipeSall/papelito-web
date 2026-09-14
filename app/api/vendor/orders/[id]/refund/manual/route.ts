import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../../_lib/require-vendor-session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const proofId = Number(body?.proofId);

  if (!Number.isInteger(proofId) || proofId <= 0) {
    return NextResponse.json({ message: "Anexe o comprovante da transferência." }, { status: 422 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/refund/manual`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: {
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
  revalidatePath(`/vendor/pedidos/${id}`);
  revalidatePath("/vendor/pedidos");
  revalidatePath(`/perfil/pedidos/${id}`);

  return NextResponse.json(result.data);
}
