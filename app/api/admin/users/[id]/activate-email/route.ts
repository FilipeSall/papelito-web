import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const session = await getAdminApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const { id } = await context.params;
  const userId = Number.parseInt(id, 10);

  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ message: "Usuário inválido." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/admin/users/${userId}/activate-email`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao ativar usuário." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
