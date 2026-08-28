import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

function responseError(message: string, status: number, code?: string) {
  return NextResponse.json({ code, message }, { status });
}

async function forward(request: Request, slug: string, method: "PUT" | "DELETE") {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return responseError(auth.error, auth.status);
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return responseError("Payload inválido.", 400);
  }

  const result = await wpRest<unknown>(
    `/papelito/v1/integration-secrets/${encodeURIComponent(slug)}`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: body,
      method,
    },
  );

  if (!result.ok) {
    return responseError(result.error.message, result.status || 502, result.error.code);
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return forward(request, slug, "PUT");
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return forward(request, slug, "DELETE");
}
