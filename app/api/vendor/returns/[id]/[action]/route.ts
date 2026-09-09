import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";
import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

const ACTIONS = new Set(["approve", "reject", "authorization", "tracking", "received", "inspection", "refund"]);
type Context = { params: Promise<{ action: string; id: string }> };

export async function POST(request: Request, { params }: Context) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const { action, id } = await params;
  if (!/^\d+$/.test(id) || !ACTIONS.has(action)) return NextResponse.json({ message: "Ação de devolução inválida." }, { status: 422 });
  const body = await request.json().catch(() => ({}));
  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/returns/${id}/${action}`, { headers: { Authorization: `Bearer ${auth.accessToken}` }, json: body, method: "POST" });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
