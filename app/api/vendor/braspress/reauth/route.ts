import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

type WpReauthTicket = {
  expires_in?: unknown;
  ticket?: unknown;
};

/**
 * Confirma a senha da conta do vendor no WordPress e devolve o tíquete de curta
 * duração que autoriza a próxima mutação de credencial da Braspress.
 *
 * Ao contrário de `/api/vendor/braspress`, que repassa o corpo inteiro, aqui só
 * a senha atravessa: nada além dela chega ao WordPress e nada além do tíquete
 * volta. A senha não é guardada em lugar nenhum — quem a segura até o envio é o
 * tíquete, e é isso que a tela usa no lugar dela.
 */
export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  if (!currentPassword) {
    return NextResponse.json({ message: "Informe sua senha atual." }, { status: 400 });
  }

  const result = await wpRest<WpReauthTicket>(
    "/papelito/v1/vendor/me/integrations/braspress/reauth",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: { currentPassword },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message, code: result.error.code },
      { status: result.status || 502 },
    );
  }

  const ticket = typeof result.data?.ticket === "string" ? result.data.ticket : "";

  if (!ticket) {
    return NextResponse.json({ message: "Confirmação indisponível." }, { status: 502 });
  }

  return NextResponse.json({ expiresIn: Number(result.data?.expires_in) || 0, ticket });
}
