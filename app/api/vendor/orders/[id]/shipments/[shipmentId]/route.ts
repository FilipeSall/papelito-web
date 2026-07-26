import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../../_lib/require-vendor-session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; shipmentId: string }> }) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const { id, shipmentId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(shipmentId)) return NextResponse.json({ message: "Envio invalido." }, { status: 400 });
  const body = await request.json().catch(() => null) as { trackingCode?: unknown; postedAt?: unknown } | null;
  const trackingCode = typeof body?.trackingCode === "string" ? body.trackingCode.replace(/\s+/g, "").toUpperCase() : "";
  const postedAt = typeof body?.postedAt === "string" ? body.postedAt.trim() : "";
  if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(trackingCode) || !/^\d{4}-\d{2}-\d{2}$/.test(postedAt)) {
    return NextResponse.json({ message: "Informe um codigo S10 e a data da postagem." }, { status: 422 });
  }
  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/shipments/${shipmentId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { tracking_code: trackingCode, posted_at: postedAt },
  });
  if (!result.ok) return NextResponse.json({ code: result.error.code, message: result.error.message }, { status: result.status || 502 });
  revalidateTag("vendor-orders", "max");
  revalidatePath(`/vendor/pedidos/${id}`);
  revalidatePath(`/perfil/pedidos/${id}`);
  return NextResponse.json(result.data);
}
