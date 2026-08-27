import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { getAdminFlashSaleProducts } from "@/lib/server/admin-flash-sale";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await readWithAdminApiSession((accessToken) =>
    getAdminFlashSaleProducts(accessToken, {
      category: url.searchParams.get("category") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    }),
  );

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
