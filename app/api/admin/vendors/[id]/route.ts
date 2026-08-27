import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { getAdminVendorDetail } from "@/lib/server/admin-vendors";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);

  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  const session = await readWithAdminApiSession((accessToken) =>
    getAdminVendorDetail(accessToken, vendorId),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const detail = session.data;

  if (!detail) {
    return NextResponse.json({ message: "Vendor não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ vendor: detail });
}
