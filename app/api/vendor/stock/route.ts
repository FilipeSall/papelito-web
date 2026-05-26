import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

export async function GET(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const params = new URL(request.url).searchParams.toString();
  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/stock${params ? `?${params}` : ""}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}

export async function PUT(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { product_id?: number; qty?: number; reason?: string }
    | null;

  if (!body || !Number.isInteger(body.product_id) || !Number.isInteger(body.qty) || Number(body.qty) < 0) {
    return NextResponse.json({ message: "Produto e quantidade valida sao obrigatorios." }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/stock", {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidatePath("/vendor/estoque");
  revalidatePath("/vendor/dashboard");
  return NextResponse.json(result.data);
}
