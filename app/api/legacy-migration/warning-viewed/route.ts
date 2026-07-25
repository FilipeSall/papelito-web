import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST() {
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const result = await wpRest<{ ok: boolean }>("/papelito/v1/legacy-migration/warning-viewed", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
