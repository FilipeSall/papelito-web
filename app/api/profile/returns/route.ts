import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getUserApiSession();
  if ("error" in session) return NextResponse.json({ message: session.error }, { status: session.status });
  const result = await wpRest<unknown>("/papelito/v1/profile/me/returns", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
