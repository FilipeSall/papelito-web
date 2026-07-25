import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import {
  createVendorInterest,
  VendorInterestRequestError,
} from "@/features/revendedor/server/vendor-interest";
import type { CreateVendorInterestInput } from "@/features/revendedor/types/vendor-interest";
import { authOptions } from "@/lib/auth";
import { fetchCurrentUserRole } from "@/lib/server/current-user-role";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user && session.accessToken) {
    const role = await fetchCurrentUserRole(session.accessToken).catch(() => undefined);
    if (role !== undefined && role !== "customer") {
      return NextResponse.json(
        { code: "customer_only", message: "Apenas customers podem registrar interesse." },
        { status: 403 },
      );
    }
  }

  const payload = (await request.json().catch(() => null)) as CreateVendorInterestInput | null;
  if (!payload) {
    return NextResponse.json({ code: "invalid_payload", message: "Payload inválido." }, { status: 400 });
  }

  try {
    const interest = await createVendorInterest(session?.accessToken ?? null, payload);
    return NextResponse.json({ interest }, { status: 201 });
  } catch (error) {
    if (error instanceof VendorInterestRequestError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { code: "vendor_interest_failed", message: "Não foi possível registrar seu interesse." },
      { status: 500 },
    );
  }
}

