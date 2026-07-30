import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

const INVITE_COOKIE = "papelito_invite_token";

/**
 * Aceita o convite. Exige autenticação. O token vem do cookie HttpOnly gravado no preview (não
 * do corpo nem da URL, que já foram limpos). O WordPress valida e-mail confirmado, expiração, uso único
 * e a inexistência de vínculo, invalidando o token transacionalmente.
 */
export async function POST() {
  const auth = await getUserApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(INVITE_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Convite não encontrado." }, { status: 400 });
  }

  const result = await wpRest(`/papelito/v1/company-invitations/${encodeURIComponent(token)}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
  });

  const response = result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(result.error, { status: result.status || 502 });

  // Convite consumido (ou tentativa concluída): descarta o cookie de token de uso único.
  if (result.ok) {
    response.cookies.set(INVITE_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}
