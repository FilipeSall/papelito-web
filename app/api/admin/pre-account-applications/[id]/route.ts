import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

function applicationId(value: string) {
  const match = /^pre:(\d+)$/.exec(value);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = applicationId((await params).id);
  if (id <= 0) {
    return NextResponse.json({ message: "Candidatura inválida." }, { status: 400 });
  }

  const session = await readWithAdminApiSession((accessToken) =>
    wpRest(`/papelito/v1/admin/pre-account-applications/${id}`, {
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
