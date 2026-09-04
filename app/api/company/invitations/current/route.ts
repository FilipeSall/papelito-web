import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

const INVITE_COOKIE = "papelito_invite_token";

/** Obtém o preview do convite guardado apenas em cookie HttpOnly. */
export async function GET() {
  const token = (await cookies()).get(INVITE_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Convite não encontrado." }, { status: 404 });
  }

  const result = await wpRest<{
    invitationId: number;
    companyName: string;
    companyCnpj: string;
    invitedRole: string;
    invitedEmail: string;
  }>(`/papelito/v1/company-invitations/${encodeURIComponent(token)}`);

  const response = result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json(result.error, { status: result.status || 404 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
