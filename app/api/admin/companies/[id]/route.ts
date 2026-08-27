import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readWithAdminApiSession((accessToken) =>
    wpRest(`/papelito/v1/admin/companies/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
  );
  if ("error" in session) return NextResponse.json({ message: session.error }, { status: session.status });
  const result = session.data;
  return result.ok ? NextResponse.json(result.data) : NextResponse.json(result.error, { status: result.status });
}
