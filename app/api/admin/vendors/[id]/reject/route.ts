import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";
import { wpRest } from "@/lib/server/wp-rest";

type RejectPayload = {
  reason?: string;
};

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const payload = (await request.json().catch(() => null)) as RejectPayload | null;
  const reason = String(payload?.reason ?? "").trim();

  if (!reason) {
    return NextResponse.json(
      { message: "Informe o motivo da recusa." },
      { status: 422 },
    );
  }

  const result = await wpRest<AdminVendorDetail>(
    `/papelito/v1/admin/vendor-applications/${vendorId}/reject`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      json: { reason },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao recusar vendor." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({ vendor: result.data });
}
