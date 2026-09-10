import { NextResponse } from "next/server";

import type { WpChamado } from "@/features/chamados/services/chamado-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { revalidateChamados } from "../../../_lib/revalidate-chamados";
import { requireMessageAccessToken } from "../../../_lib/require-message-session";

/**
 * Encerra o chamado.
 *
 * A autorização é do WordPress: só a loja do pedido e a Papelito encerram, e o cliente recebe 403
 * mesmo chamando a rota direto. Aqui só repassamos a decisão e a mensagem dela.
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Chamado inválido." }, { status: 400 });
  }

  const result = await wpRest<WpChamado>(`/papelito/v1/messages/threads/${id}/close`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  revalidateChamados(id);
  return NextResponse.json(result.data);
}
