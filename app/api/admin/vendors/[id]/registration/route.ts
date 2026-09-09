import { NextResponse } from "next/server";

import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = { params: Promise<{ id: string }> };

function parseVendorId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const vendorId = Number.parseInt(value, 10);

  return Number.isSafeInteger(vendorId) && vendorId > 0 ? vendorId : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = parseVendorId(id);

  if (vendorId === null) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  const result = await wpRest<VendorPendingRegistrationResponse>(
    `/papelito/v1/admin/vendors/${vendorId}/registration`,
    { headers: { Authorization: `Bearer ${auth.accessToken}` } },
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.error.code,
        message: result.error.message ?? "Não foi possível carregar o vendor.",
      },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({ registration: result.data });
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = parseVendorId(id);

  if (vendorId === null) {
    return NextResponse.json({ message: "ID inválido." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const result = await wpRest<VendorPendingRegistrationResponse>(
    `/papelito/v1/admin/vendors/${vendorId}/registration`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: { application: payload.application, draft: payload.draft },
      method: "PUT",
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message ?? "Falha ao salvar o vendor." },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json({ registration: result.data });
}
