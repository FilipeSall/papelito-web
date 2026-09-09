import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const session = await getUserApiSession();
  if ("error" in session) return NextResponse.json({ message: session.error }, { status: session.status });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!/^\d+$/.test(id) || !body || typeof body !== "object") {
    return NextResponse.json({ message: "Solicitação de devolução inválida." }, { status: 422 });
  }
  const result = await wpRest<unknown>(`/papelito/v1/profile/me/orders/${id}/returns`, {
    headers: { Authorization: `Bearer ${session.accessToken}` }, json: body, method: "POST",
  });
  return result.ok ? NextResponse.json(result.data, { status: result.status }) : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
