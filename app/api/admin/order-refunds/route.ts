import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export const dynamic = "force-dynamic";

const FILTERS = new Set(["overdue", "pending", "all"]);

export async function GET(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const requested = new URL(request.url).searchParams.get("filter") ?? "overdue";
  const filter = FILTERS.has(requested) ? requested : "overdue";
  const result = await wpRest<unknown>(`/papelito/v1/admin/order-refunds?filter=${filter}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
