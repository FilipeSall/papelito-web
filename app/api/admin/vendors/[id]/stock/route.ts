import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { parseStockFilter } from "@/lib/server/admin-vendor-filters";
import { wpRest } from "@/lib/server/wp-rest";

type StockUpdatePayload = {
  product_id?: number;
  qty?: number;
  reason?: string;
};

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
    filter: parseStockFilter(url.searchParams.get("filter")),
    page: String(Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "", 10) || 1)),
    paginate: url.searchParams.get("paginate") === "false" ? "false" : "true",
    per_page: String(
      Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("perPage") ?? "", 10) || 50)),
    ),
  });

  const search = url.searchParams.get("search")?.trim() ?? "";
  if (search) {
    params.set("search", search);
  }

  const result = await wpRest<unknown>(
    `/papelito/v1/admin/vendors/${vendorId}/stock?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Nao foi possivel carregar o estoque." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);
  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID invalido." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as StockUpdatePayload | null;
  const qty = Number(payload?.qty);
  const productId = Number(payload?.product_id);
  const reason = String(payload?.reason ?? "").trim();

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ message: "Produto invalido." }, { status: 422 });
  }

  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json({ message: "Quantidade invalida." }, { status: 422 });
  }

  if (reason.length < 10) {
    return NextResponse.json(
      { message: "Motivo obrigatorio com pelo menos 10 caracteres." },
      { status: 422 },
    );
  }

  const result = await wpRest<unknown>(`/papelito/v1/admin/vendors/${vendorId}/stock`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { product_id: productId, qty, reason },
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Nao foi possivel ajustar o estoque." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}
