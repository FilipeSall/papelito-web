import { NextResponse } from "next/server";

import { setApplicationCookie } from "@/lib/server/company-application-cookie";
import { wpRest } from "@/lib/server/wp-rest";

type ResumeResponse = {
  application: { status: string; canUpload: boolean; emailVerified: boolean };
  resume_token: string;
};

/**
 * Retoma a candidatura pré-conta a partir do e-mail e da senha escolhidos no cadastro.
 *
 * Serve a quem tenta entrar pelo login antes de a conta existir — ela só nasce na aprovação.
 * O WordPress responde o mesmo erro para senha errada e para candidatura inexistente, então
 * esta rota não distingue os dois casos nem no status nem na mensagem.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const result = await wpRest<ResumeResponse>("/papelito/v1/company-applications/resume", {
    method: "POST",
    json: payload,
  });
  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status || 502 });
  }

  const response = NextResponse.json(
    { application: result.data.application },
    { status: result.status },
  );
  setApplicationCookie(response, result.data.resume_token);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
