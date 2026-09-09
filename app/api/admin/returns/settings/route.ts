import { NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET() {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const result = await wpRest<unknown>("/papelito/v1/admin/returns/settings", { headers: { Authorization: `Bearer ${auth.accessToken}` } });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}

export async function PATCH(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const result = await wpRest<unknown>("/papelito/v1/admin/returns/settings", { headers: { Authorization: `Bearer ${auth.accessToken}` }, json: await request.json().catch(() => ({})), method: "PATCH" });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
