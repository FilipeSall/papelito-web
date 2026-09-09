import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

type Context = { params: Promise<{ id: string }> };
async function proxy(method: "GET" | "DELETE", params: Context["params"]) {
  const session = await getUserApiSession();
  if ("error" in session) return NextResponse.json({ message: session.error }, { status: session.status });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Devolução inválida." }, { status: 422 });
  const result = await wpRest<unknown>(`/papelito/v1/profile/me/returns/${id}`, { headers: { Authorization: `Bearer ${session.accessToken}` }, method });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
export async function GET(_request: Request, { params }: Context) { return proxy("GET", params); }
export async function DELETE(_request: Request, { params }: Context) { return proxy("DELETE", params); }
