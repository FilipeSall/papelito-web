import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

const INVITE_COOKIE = "papelito_invite_token";

type InvitationRegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export async function POST(request: Request) {
  let body: InvitationRegisterPayload;
  try {
    body = (await request.json()) as InvitationRegisterPayload;
  } catch {
    return NextResponse.json({ message: "JSON inválido." }, { status: 400 });
  }

  const token = (await cookies()).get(INVITE_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Convite não encontrado." }, { status: 400 });
  }

  const result = await wpRest<{
    ok: true;
    accountExists: boolean;
    requiresEmailVerification: boolean;
    requiresLogin?: boolean;
    email: string;
  }>("/papelito/v1/auth/register-invitation", { json: { ...body, token } });

  // 201 só quando a conta nasceu agora; retomada de conta existente volta 200 do WordPress.
  return result.ok
    ? NextResponse.json(result.data, { status: result.status || 200 })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
