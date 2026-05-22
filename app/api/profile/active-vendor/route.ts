import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import {
  getActiveVendor,
  setActiveVendor,
} from "@/features/active-vendor/server";

function errorStatusFor(reason: string): number {
  switch (reason) {
    case "unauthenticated":
      return 401;
    case "missing_cep":
      return 409;
    case "no_vendor_available":
      return 404;
    case "network":
      return 502;
    default:
      return 500;
  }
}

export async function GET() {
  const result = await getActiveVendor();

  if (result.ok) {
    return NextResponse.json({ vendor: result.vendor });
  }

  return NextResponse.json(
    { error: result.error },
    { status: errorStatusFor(result.error.reason) },
  );
}

export async function PUT(request: Request) {
  const payload = (await request.json().catch(() => null)) as { vendorId?: number } | null;

  if (!payload || typeof payload.vendorId !== "number") {
    return NextResponse.json(
      { error: { reason: "unknown", message: "vendorId obrigatório." } },
      { status: 400 },
    );
  }

  const result = await setActiveVendor(payload.vendorId);

  if (result.ok) {
    revalidateTag("wp:coverage", "max");
    return NextResponse.json({ vendor: result.vendor });
  }

  return NextResponse.json(
    { error: result.error },
    { status: errorStatusFor(result.error.reason) },
  );
}
