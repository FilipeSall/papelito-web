import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const result = await wpRest<{ items: unknown[] }>(
    `/papelito/v1/admin/coupons/vendor-options${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      cache: "no-store",
    } as Parameters<typeof wpRest>[1],
  );

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message }, { status: result.status || 500 });
  }

  return NextResponse.json(result.data);
}
