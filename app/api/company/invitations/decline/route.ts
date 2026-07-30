import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

const INVITE_COOKIE = "papelito_invite_token";

export async function POST() {
  const auth = await getUserApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const token = (await cookies()).get(INVITE_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Convite não encontrado." }, { status: 400 });
  const result = await wpRest(`/papelito/v1/company-invitations/${encodeURIComponent(token)}/decline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}`, "Idempotency-Key": crypto.randomUUID() },
  });
  const response = result.ok ? NextResponse.json(result.data) : NextResponse.json(result.error, { status: result.status || 502 });
  if (result.ok) response.cookies.set(INVITE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
