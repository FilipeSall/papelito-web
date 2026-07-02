import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  VENDOR_REJECTION_REASON_LENGTH_MESSAGE,
  VENDOR_REJECTION_REASON_MAX_LENGTH,
  VENDOR_REJECTION_REASON_MIN_LENGTH,
} from "@/lib/admin-vendors-constants";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import type { AdminVendorDetail } from "@/lib/server/admin-vendors";
import { wpRest } from "@/lib/server/wp-rest";

type RejectPayload = {
  reason?: string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);

  if (!Number.isFinite(vendorId) || vendorId <= 0) {
    return NextResponse.json({ message: "ID invalido." }, { status: 400 });
  }

  const payload = (await request.json().catch(() => null)) as RejectPayload | null;
  const reason = String(payload?.reason ?? "").trim();

  if (
    reason.length < VENDOR_REJECTION_REASON_MIN_LENGTH ||
    reason.length > VENDOR_REJECTION_REASON_MAX_LENGTH
  ) {
    return NextResponse.json(
      { message: VENDOR_REJECTION_REASON_LENGTH_MESSAGE },
      { status: 422 },
    );
  }

  const result = await wpRest<AdminVendorDetail>(
    `/papelito/v1/admin/vendors/${vendorId}/reject`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: { reason },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message ?? "Falha ao recusar vendor." },
      { status: result.status || 500 },
    );
  }

  revalidateTag("admin-vendors", "max");
  return NextResponse.json({ vendor: result.data });
}
