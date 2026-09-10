import { NextResponse } from "next/server";

import {
  type WpChamado,
  type WpChamadosSnapshot,
} from "@/features/chamados/services/chamado-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { revalidateChamados } from "../_lib/revalidate-chamados";
import { requireMessageAccessToken } from "../_lib/require-message-session";

export async function GET(request: Request) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const requested = new URL(request.url).searchParams;
  const upstream = new URLSearchParams();
  for (const key of ["escalated", "kind", "order_id", "page", "per_page", "reason", "search", "status"]) {
    const value = requested.get(key);
    if (value !== null) upstream.set(key, value);
  }

  const query = upstream.toString();
  const result = await wpRest<WpChamadosSnapshot>(
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

  const body = (await request.json().catch(() => null)) as
    | { body?: unknown; order_id?: unknown; reason?: unknown }
    | null;

  // O motivo é obrigatório também aqui: o WordPress recusaria de qualquer forma, e barrar antes
  // evita uma ida ao backend só para receber 422.
  if (!body || !Number.isInteger(body.order_id) || typeof body.body !== "string") {
    return NextResponse.json({ message: "Pedido e mensagem são obrigatórios." }, { status: 400 });
  }

  if (typeof body.reason !== "string" || body.reason.trim() === "") {
    return NextResponse.json({ message: "Escolha um motivo para o chamado." }, { status: 422 });
  }

  const result = await wpRest<WpChamado>("/papelito/v1/messages/threads", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidateChamados(result.data.thread_id as number | undefined);
  return NextResponse.json(result.data, { status: 201 });
}
