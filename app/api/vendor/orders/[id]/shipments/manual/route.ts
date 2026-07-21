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
    return NextResponse.json({ message: "Pedido invalido." }, { status: 400 });
  }
  const body = (await request.json().catch(() => null)) as { trackingCode?: unknown } | null;
  const trackingCode = typeof body?.trackingCode === "string" ? body.trackingCode.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(trackingCode)) {
    return NextResponse.json(
      { code: "papelito_tracking_invalid_code", message: "Informe um codigo S10 valido, como AA123456789BR." },
      { status: 422 },
    );
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/shipments/manual`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { tracking_code: trackingCode },
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
