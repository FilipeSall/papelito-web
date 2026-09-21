import "server-only";

import type { NextResponse } from "next/server";

/**
 * Cookie que guarda o `resume_token` da candidatura pré-conta.
 *
 * O prefixo `__Host-` é parte do contrato: o navegador só aceita o cookie com `Secure` e
 * `Path=/`, e o descarta em silêncio se algum dos dois faltar — inclusive em localhost.
 */
export const APPLICATION_COOKIE = "__Host-papelito_application";

const APPLICATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Grava o token de retomada da candidatura na resposta, com os atributos que o `__Host-` exige.
 *
 * Chrome e Firefox aceitam cookies `Secure` em `http://localhost`, então isso não quebra o dev.
 */
export function setApplicationCookie(response: NextResponse, token: string): void {
  response.cookies.set(APPLICATION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: APPLICATION_COOKIE_MAX_AGE_SECONDS,
  });
}
