import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = Number.parseInt(id, 10);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ message: "Usuário inválido." }, { status: 400 });
  }

  const session = await readWithAdminApiSession((accessToken) =>
    wpRest(`/papelito/v1/admin/users/${userId}/owner-applications`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );
  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }
  const result = session.data;
  return result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
