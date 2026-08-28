import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

function responseError(message: string, status: number, code?: string) {
  return NextResponse.json({ code, message }, { status });
}

export async function GET() {
  const session = await readWithAdminApiSession((accessToken) =>
    wpRest<unknown>("/papelito/v1/integration-secrets", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return responseError(session.error, session.status);
  }

  if (!session.data.ok) {
    return responseError(
      session.data.error.message,
      session.data.status || 502,
      session.data.error.code,
    );
  }

  return NextResponse.json(session.data.data);
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return responseError(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return responseError("Payload inválido.", 400);
  }

  const result = await wpRest<unknown>("/papelito/v1/integration-secrets/confirm", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "POST",
  });

  if (!result.ok) {
    return responseError(result.error.message, result.status || 502, result.error.code);
  }

  return NextResponse.json(result.data, { status: result.status });
}
