import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { parseStockFilter } from "@/lib/server/admin-vendor-filters";
import { getAdminVendorStock } from "@/lib/server/admin-vendor-operations";

function escapeCsv(value: unknown) {
  const text = typeof value === "string" ? value : String(value ?? "");
  if (/[",;\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

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
  const filter = parseStockFilter(url.searchParams.get("filter"));
  const search = url.searchParams.get("search")?.trim() ?? "";

  const snapshot = await getAdminVendorStock(auth.accessToken, vendorId, {
    filter,
    page: 1,
    paginate: false,
    perPage: 100,
    search,
  });

  const lines = [
    "\uFEFFproduct_name;sku;qty;updated_at",
    ...snapshot.items.map((item) =>
      [
        escapeCsv(item.productName),
        escapeCsv(item.sku),
        escapeCsv(item.qty),
        escapeCsv(item.updatedAt),
      ].join(";"),
    ),
  ];

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set(
    "Content-Disposition",
    `attachment; filename="vendor-${vendorId}-stock-${filter}.csv"`,
  );

  return new NextResponse(lines.join("\n"), { headers, status: 200 });
}
