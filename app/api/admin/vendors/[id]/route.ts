import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { getAdminVendorDetail } from "@/lib/server/admin-vendors";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);

  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  const detail = await getAdminVendorDetail(auth.accessToken, vendorId);

  if (!detail) {
    return NextResponse.json({ message: "Vendor não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ vendor: detail });
}
