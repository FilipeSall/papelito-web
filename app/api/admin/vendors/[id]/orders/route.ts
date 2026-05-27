import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { parseVendorOrderStatus } from "@/lib/server/admin-vendor-filters";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);
  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID invalido." }, { status: 400 });
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

  const result = await wpRest<unknown>(
    `/papelito/v1/admin/vendors/${vendorId}/orders?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Nao foi possivel carregar os pedidos." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}
