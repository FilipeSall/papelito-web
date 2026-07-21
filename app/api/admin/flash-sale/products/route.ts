import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { getAdminFlashSaleProducts } from "@/lib/server/admin-flash-sale";

export async function GET(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const snapshot = await getAdminFlashSaleProducts(auth.accessToken, {
    category: url.searchParams.get("category") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  });

  return NextResponse.json(snapshot);
}
