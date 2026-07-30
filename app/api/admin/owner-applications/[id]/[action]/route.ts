import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { action, id } = await params;
  const applicationId = Number.parseInt(id, 10);
  if (!Number.isFinite(applicationId) || applicationId <= 0 || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ message: "Candidatura ou ação inválida." }, { status: 400 });
  }

  const payload = await request.json().catch(() => ({}));
  const result = await wpRest(
    `/papelito/v1/admin/owner-applications/${applicationId}/${action}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      json: payload,
    },
  );
  return result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
