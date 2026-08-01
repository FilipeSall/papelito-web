import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

const APPLICATION_COOKIE = "__Host-papelito_application";

export async function GET() {
  const token = (await cookies()).get(APPLICATION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Candidatura não encontrada." }, { status: 404 });

  const result = await wpRest("/papelito/v1/company-applications/current", {
    headers: { "X-Papelito-Application-Token": token },
  });
  return result.ok
    ? NextResponse.json(result.data, { status: result.status, headers: { "Cache-Control": "no-store" } })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
