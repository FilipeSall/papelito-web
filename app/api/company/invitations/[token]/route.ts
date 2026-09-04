import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

const INVITE_COOKIE = "papelito_invite_token";

type Ctx = { params: Promise<{ token: string }> };

/**
 * Valida o token de convite no backend ANTES de revelar qualquer dado. Em caso de sucesso,
 * move o token para um cookie HttpOnly/Secure/SameSite=Lax e devolve apenas o preview neutro
 * (nome da empresa, papel e e-mail convidado) — nunca CNPJ, membros ou dados fiscais.
 * O token nunca é persistido no cliente (localStorage) nem exposto na resposta.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const { token } = await params;

  const result = await wpRest<{
    invitationId: number;
    companyName: string;
    companyCnpj: string;
    invitedRole: string;
    invitedEmail: string;
  }>(`/papelito/v1/company-invitations/${encodeURIComponent(token)}`);

  if (!result.ok) {
    return NextResponse.json(
      { code: "papelito_invitation_invalid", message: "Este convite não é válido ou expirou." },
      { status: result.status || 404 },
    );
  }

  const response = NextResponse.json(result.data);
	response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set(INVITE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
