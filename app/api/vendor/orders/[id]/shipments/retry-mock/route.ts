import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../../_lib/require-vendor-session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido invalido." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/shipments/retry-mock`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });
  if (!result.ok) {
    const data = result.error.data ?? {};
    return NextResponse.json(
      {
        category: typeof data.category === "string" ? data.category : "unknown",
        code: result.error.code,
        manual_fallback_available: Boolean(data.manual_fallback_available),
        message: result.error.message,
        retryable: Boolean(data.retryable),
      },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-orders", "max");
  revalidatePath(`/vendor/pedidos/${id}`);
  return NextResponse.json(result.data, { status: 201 });
}
