import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";
import { requireVendorAccessToken } from "../_lib/require-vendor-session";

export const dynamic = "force-dynamic";
export async function GET() {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const result = await wpRest<unknown>("/papelito/v1/vendor/me/returns", { headers: { Authorization: `Bearer ${auth.accessToken}` } });
  return result.ok ? NextResponse.json(result.data) : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
