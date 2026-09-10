import { NextResponse } from "next/server";

import type { WpChamado } from "@/features/chamados/services/chamado-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { revalidateChamados } from "../../../_lib/revalidate-chamados";
import { requireMessageAccessToken } from "../../../_lib/require-message-session";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Conversa invalida." }, { status: 400 });

  const result = await wpRest<WpChamado>(`/papelito/v1/messages/threads/${id}/escalate`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: {},
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidateChamados(result.data.thread_id as number | undefined);
  return NextResponse.json(result.data);
}
