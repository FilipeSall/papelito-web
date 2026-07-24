import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const { id } = await params;
  const result = await wpRest(`/papelito/v1/admin/companies/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${auth.accessToken}` } });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json(result.error, { status: result.status });
}
