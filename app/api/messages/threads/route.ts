import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  type WpMessageThread,
  type WpMessageThreadsSnapshot,
} from "@/features/messages/services/message-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { requireMessageAccessToken } from "../_lib/require-message-session";

export async function GET(request: Request) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const requested = new URL(request.url).searchParams;
  const upstream = new URLSearchParams();
  for (const key of ["order_id", "page", "per_page", "search"]) {
    const value = requested.get(key);
    if (value !== null) upstream.set(key, value);
  }

  const query = upstream.toString();
  const result = await wpRest<WpMessageThreadsSnapshot>(
    `/papelito/v1/messages/threads${query ? `?${query}` : ""}`,
    { headers: { Authorization: `Bearer ${auth.accessToken}` } },
  );

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}

export async function POST(request: Request) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const body = (await request.json().catch(() => null)) as { body?: unknown; order_id?: unknown } | null;
  if (!body || !Number.isInteger(body.order_id) || typeof body.body !== "string") {
    return NextResponse.json({ message: "Pedido e mensagem são obrigatórios." }, { status: 400 });
  }

  const result = await wpRest<WpMessageThread>("/papelito/v1/messages/threads", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath(`/perfil/pedidos/${body.order_id}/suporte`);
  revalidatePath("/vendor/mensagens");
  return NextResponse.json(result.data, { status: 201 });
}
