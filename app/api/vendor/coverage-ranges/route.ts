import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

type RangePayload = {
  maxCep?: string;
  minCep?: string;
};

export async function GET() {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/coverage-ranges", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}

export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as RangePayload | null;

  if (!body) {
    return NextResponse.json({ message: "Informe a faixa de CEP." }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/coverage-ranges", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath("/vendor/cobertura");
  return NextResponse.json(result.data, { status: 201 });
}
