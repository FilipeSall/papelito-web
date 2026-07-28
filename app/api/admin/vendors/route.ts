import { NextResponse } from "next/server";

import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as AdminVendorCreatePayload | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const result = await wpRest<AdminVendorDetail>("/papelito/v1/admin/vendors", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
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
