import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

type RangePayload = {
  maxCep?: string;
  minCep?: string;
};

type RouteParams = {
  params: Promise<{ id: string }>;
};

function parseRangeId(id: string) {
  const rangeId = Number.parseInt(id, 10);

  return Number.isInteger(rangeId) && rangeId > 0 ? rangeId : null;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const rangeId = parseRangeId(id);

  if (!rangeId) {
    return NextResponse.json({ message: "Faixa de CEP invalida." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as RangePayload | null;

  if (!body) {
    return NextResponse.json({ message: "Informe a faixa de CEP." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/coverage-ranges/${rangeId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath("/vendor/cobertura");
  return NextResponse.json(result.data);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const rangeId = parseRangeId(id);

  if (!rangeId) {
    return NextResponse.json({ message: "Faixa de CEP invalida." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/coverage-ranges/${rangeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath("/vendor/cobertura");
  return NextResponse.json(result.data);
}
