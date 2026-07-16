import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido invalido." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/shipments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
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
