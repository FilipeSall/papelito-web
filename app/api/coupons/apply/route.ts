import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json(
      { code: "papelito_coupon_auth_required", message: "Faca login para aplicar cupons." },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const result = await wpRest<{
    ok?: boolean;
    code?: string;
    discount_type?: string;
    discount_value?: number;
    applied_product_ids?: number[];
  }>("/papelito/v1/coupons/apply", {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    method: "POST",
    json: payload,
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}
