import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);

  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID invalido." }, { status: 400 });
  }

  const result = await wpRest<AdminVendorDetail>(
    `/papelito/v1/admin/vendors/${vendorId}/approve`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: {},
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao aprovar vendor." },
      { status: result.status || 500 },
    );
  }

  revalidateTag("admin-vendors", "max");
  return NextResponse.json({ vendor: result.data });
}
