import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const result = await wpRest<Record<string, unknown>>("/papelito/v1/cart/pricing", {
    method: "POST",
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : undefined,
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
