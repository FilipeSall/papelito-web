import { NextResponse } from "next/server";

import { getPendingInvitationPreview } from "@/lib/server/company-invitation-preview";

/**
 * Preview do convite guardado apenas em cookie HttpOnly, para o cadastro por convite.
 *
 * O painel do perfil não consome esta rota: `PendingInvitationNotice` chama o mesmo helper direto
 * no servidor. As duas leituras compartilham o helper para não divergirem.
 */
export async function GET() {
  const invitation = await getPendingInvitationPreview();

  const response =
    invitation.kind === "ok"
      ? NextResponse.json(invitation.payload)
      : invitation.kind === "error"
        ? NextResponse.json(invitation.error, { status: invitation.status || 404 })
        : NextResponse.json({ message: "Convite não encontrado." }, { status: 404 });

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
