import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { readWithVendorAccessToken } from "../../_lib/require-vendor-session";

/**
 * Lista o catálogo RPC autorizado para o formulário de cubagem.
 *
 * @returns Os 21 modelos estáticos de preenchimento.
 */
export async function GET() {
  const session = await readWithVendorAccessToken((accessToken) =>
    wpRest<unknown>("/papelito/v1/vendor/me/packaging-profiles/catalog", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  if (!session.data.ok) {
    return NextResponse.json(
      { code: session.data.error.code, message: session.data.error.message },
      { status: session.data.status || 502 },
    );
  }

  return NextResponse.json(session.data.data);
}
