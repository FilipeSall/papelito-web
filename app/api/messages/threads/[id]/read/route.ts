import { NextResponse } from "next/server";

import type { WpMessageThread } from "@/features/messages/services/message-mappers";
import { wpRest } from "@/lib/server/wp-rest";

import { requireMessageAccessToken } from "../../../_lib/require-message-session";

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireMessageAccessToken();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ message: "Conversa invalida." }, { status: 400 });

  const result = await wpRest<WpMessageThread>(`/papelito/v1/messages/threads/${id}/read`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "PUT",
  });

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
