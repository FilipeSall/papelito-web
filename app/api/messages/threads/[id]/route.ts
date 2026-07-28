import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { WpMessageThread } from "@/features/messages/services/message-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { requireMessageAccessToken } from "../../_lib/require-message-session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Conversa invalida." }, { status: 400 });

  const result = await wpRest<WpMessageThread>(`/papelito/v1/messages/threads/${id}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { body?: unknown } | null;
  if (!/^\d+$/.test(id) || !body || typeof body.body !== "string") {
    return NextResponse.json({ message: "Conversa e mensagem são obrigatorias." }, { status: 400 });
  }

  const result = await wpRest<WpMessageThread>(`/papelito/v1/messages/threads/${id}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath("/vendor/mensagens");
  revalidatePath(`/vendor/mensagens/${id}`);
  revalidatePath("/admin/suporte");
  revalidatePath(`/perfil/pedidos/${result.data.order_id}/suporte`);
  return NextResponse.json(result.data, { status: 201 });
}
