import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

function readCurrentPassword(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as { currentPassword?: unknown }).currentPassword;

  return typeof value === "string" ? value : "";
}

/**
 * Desconecta a conta Mercado Pago da loja para novas compras, com reautenticação pela senha atual.
 * Cobranças já emitidas continuam ligadas à conta histórica no WordPress.
 */
export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const currentPassword = readCurrentPassword(await request.json().catch(() => null));

  const result = await wpRest<{ disconnected?: boolean }>("/papelito/v1/vendor/mercadopago/disconnect", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { currentPassword },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 500, headers: { "Cache-Control": "no-store, private" } },
    );
  }

  revalidateTag("vendor-eligibility", "max");
  revalidateTag("vendor-payment-gateways", "max");

  return NextResponse.json({ disconnected: true }, { headers: { "Cache-Control": "no-store, private" } });
}
