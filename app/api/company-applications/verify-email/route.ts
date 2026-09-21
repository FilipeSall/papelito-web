import { NextResponse } from "next/server";

import { setApplicationCookie } from "@/lib/server/company-application-cookie";
import { wpRest } from "@/lib/server/wp-rest";

type VerifyEmailResponse = {
  application: { status: string; canUpload: boolean; emailVerified: boolean };
  resume_token: string;
};

/**
 * Confirma o e-mail de uma candidatura pré-conta a partir do token do link.
 *
 * O WordPress devolve um `resume_token` novo porque quem clica no link pode estar em outro
 * aparelho, sem o cookie da candidatura — sem gravá-lo aqui, a etapa 3 diria que não existe
 * candidatura alguma.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const result = await wpRest<VerifyEmailResponse>(
    "/papelito/v1/company-applications/verify-email",
    { method: "POST", json: payload },
  );
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
