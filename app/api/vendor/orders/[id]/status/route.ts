import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

const allowedStatuses = new Set<VendorOrderStatus>([
  "em_separacao",
  "cancelado",
]);

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | { reason?: string; status?: VendorOrderStatus }
    | null;

  if (!/^\d+$/.test(id) || !body?.status || !allowedStatuses.has(body.status)) {
    return NextResponse.json({ message: "Status invalido." }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (body.status === "cancelado" && !reason) {
    return NextResponse.json({ message: "Informe o motivo do cancelamento." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/status`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: reason ? { reason, status: body.status } : { status: body.status },
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidateTag("vendor-orders", "max");
  revalidateTag("vendor-kpis", "max");
  revalidatePath(`/vendor/pedidos/${id}`);
  revalidatePath("/vendor/pedidos");
  revalidatePath("/vendor/dashboard");
  revalidatePath("/vendor/financeiro");
  revalidatePath("/perfil");
  revalidatePath(`/perfil/pedidos/${id}`);
  return NextResponse.json(result.data);
}
