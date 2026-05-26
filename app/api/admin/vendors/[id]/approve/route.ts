import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";
import { wpRest } from "@/lib/server/wp-rest";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  if (normalizeRole(session.role) !== "administrator") {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);

  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID invalido." }, { status: 400 });
  }

  const result = await wpRest<AdminVendorDetail>(
    `/papelito/v1/admin/vendor-applications/${vendorId}/approve`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      json: {},
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao aprovar vendor." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({ vendor: result.data });
}
