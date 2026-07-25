import { NextRequest, NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: NextRequest) {
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await wpRest("/papelito/v1/legacy-migration/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
