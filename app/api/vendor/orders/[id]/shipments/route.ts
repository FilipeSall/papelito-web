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
    const data = result.error.data ?? {};
    return NextResponse.json(
      {
        category: typeof data.category === "string" ? data.category : "unknown",
        code: result.error.code,
        creation_outcome: typeof data.creation_outcome === "string" ? data.creation_outcome : "uncertain",
        message: result.error.message,
        manual_fallback_available: Boolean(data.manual_fallback_available),
        next_reconciliation_at: typeof data.next_reconciliation_at === "string" ? data.next_reconciliation_at : "",
        reconciliation_attempts: Number(data.reconciliation_attempts) || 0,
        reconciliation_status: typeof data.reconciliation_status === "string" ? data.reconciliation_status : "none",
        retryable: Boolean(data.retryable),
        support_review_required: Boolean(data.support_review_required),
      },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-orders", "max");
  revalidatePath(`/vendor/pedidos/${id}`);
  revalidatePath(`/perfil/pedidos/${id}`);
  return NextResponse.json(result.data, { status: 201 });
}
