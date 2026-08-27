import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const session = await readWithAdminApiSession((accessToken) =>
    wpRest<{ items: unknown[] }>(
      `/papelito/v1/admin/coupons/vendor-options${params.toString() ? `?${params.toString()}` : ""}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      } as Parameters<typeof wpRest>[1],
    ),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = session.data;

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message }, { status: result.status || 500 });
  }

  return NextResponse.json(result.data);
}
