import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

function applicationId(value: string) {
  const match = /^pre:(\d+)$/.exec(value);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { action, id: externalId } = await params;
  const id = applicationId(externalId);
  if (id <= 0 || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ message: "Candidatura ou ação inválida." }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const result = await wpRest(`/papelito/v1/admin/pre-account-applications/${id}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    json: payload,
  });
  return result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
