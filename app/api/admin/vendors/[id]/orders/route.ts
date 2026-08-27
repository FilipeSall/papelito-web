import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { parseVendorOrderStatus } from "@/lib/server/admin-vendor-filters";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);
  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  const url = new URL(request.url);
  const params = new URLSearchParams({
    page: String(Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "", 10) || 1)),
    per_page: String(
      Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("perPage") ?? "", 10) || 20)),
    ),
    status: parseVendorOrderStatus(url.searchParams.get("status")),
  });

  const search = url.searchParams.get("search")?.trim() ?? "";
  if (search) {
    params.set("search", search);
  }

  const session = await readWithAdminApiSession((accessToken) =>
    wpRest<unknown>(`/papelito/v1/admin/vendors/${vendorId}/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = session.data;

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Não foi possível carregar os pedidos." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}
