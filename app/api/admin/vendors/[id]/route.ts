import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getAdminVendorDetail } from "@/lib/server/admin-vendors";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
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

  const detail = await getAdminVendorDetail(session.accessToken, vendorId);

  if (!detail) {
    return NextResponse.json({ message: "Vendor nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ vendor: detail });
}
