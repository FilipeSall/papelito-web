import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const { action, id } = await params;
  if (action !== "approve" && action !== "reject") return NextResponse.json({ message: "Acao invalida." }, { status: 404 });
  const payload = await request.json().catch(() => ({}));
  const result = await wpRest(`/papelito/v1/admin/companies/${encodeURIComponent(id)}/${action}`, { method: "POST", headers: { Authorization: `Bearer ${auth.accessToken}`, "Idempotency-Key": crypto.randomUUID() }, json: payload });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json(result.error, { status: result.status });
}
