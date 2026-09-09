import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";
import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!/^\d+$/.test(id) || !body || typeof body !== "object") {
    return NextResponse.json({ message: "Abertura de devolução inválida." }, { status: 422 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/returns`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "POST",
  });

  return result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(
        { message: result.error.message, code: result.error.code },
        { status: result.status || 502 },
      );
}
