import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";
import { authOptions } from "@/lib/auth";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";
import { wpRest } from "@/lib/server/wp-rest";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  if (normalizeRole(session.role) !== "administrator") {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as AdminVendorCreatePayload | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const result = await wpRest<AdminVendorDetail>("/papelito/v1/admin/vendors", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: payload,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao criar vendor." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({ vendor: result.data }, { status: 201 });
}

