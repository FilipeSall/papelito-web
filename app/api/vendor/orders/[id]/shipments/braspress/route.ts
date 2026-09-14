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

  const body = (await request.json().catch(() => null)) as {
    externalOrderNumber?: unknown;
    postedAt?: unknown;
  } | null;
  const externalOrderNumber = typeof body?.externalOrderNumber === "string" ? body.externalOrderNumber.trim() : "";
  const postedAt = typeof body?.postedAt === "string" ? body.postedAt.trim() : "";

  if (!/^[A-Za-z0-9._/-]{1,96}$/.test(externalOrderNumber)) {
    return NextResponse.json(
      { code: "papelito_braspress_tracking_reference_invalid", message: "Informe o número de pedido confirmado na Braspress." },
      { status: 422 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(postedAt)) {
    return NextResponse.json(
      { code: "papelito_manual_posted_at_required", message: "Informe a data da postagem." },
      { status: 422 },
    );
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/shipments/braspress`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: {
      external_order_number: externalOrderNumber,
      posted_at: postedAt,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-orders", "max");
  revalidatePath(`/vendor/pedidos/${id}`);
  revalidatePath(`/perfil/pedidos/${id}`);
  return NextResponse.json(result.data, { status: 201 });
}
