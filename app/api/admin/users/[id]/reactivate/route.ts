import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const { id } = await context.params;
  const userId = Number.parseInt(id, 10);

  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Usuário inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { reason?: string } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  const result = await wpRest<unknown>(`/papelito/v1/admin/users/${userId}/reactivate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: { reason },
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao reativar a conta." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
