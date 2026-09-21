import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APPLICATION_COOKIE } from "@/lib/server/company-application-cookie";
import { wpRest } from "@/lib/server/wp-rest";

/**
 * Reenvia o link de confirmação de uma candidatura pré-conta.
 *
 * Aceita dois caminhos porque quem abre um link vencido pode estar em outro aparelho, sem o
 * cookie de retomada: o token do cookie, quando existe, ou o e-mail no corpo. O WordPress
 * responde igual nos dois casos e também quando não há candidatura, então esta rota não
 * distingue os desfechos — é o que impede a tela de reenvio de virar sonda de cadastro.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const token = (await cookies()).get(APPLICATION_COOKIE)?.value;

  const result = await wpRest("/papelito/v1/company-applications/resend-verification", {
    method: "POST",
    headers: token ? { "X-Papelito-Application-Token": token } : undefined,
    json: payload && typeof payload === "object" ? payload : {},
  });

  return result.ok
    ? NextResponse.json(result.data, { status: result.status, headers: { "Cache-Control": "no-store" } })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
