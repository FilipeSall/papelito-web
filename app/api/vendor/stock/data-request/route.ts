import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

type DataRequestBody = { message?: unknown; product_id?: unknown };

/**
 * Pede à Papelito os dados que faltam no cadastro de um produto.
 *
 * Os campos ausentes não são enviados pelo navegador: quem os afirma é a auditoria do WordPress,
 * a mesma que alimenta a listagem. O corpo carrega apenas o produto e o recado.
 */
export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as DataRequestBody | null;
  const productId = Number(body?.product_id);
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 500) : "";

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/stock/data-request", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { message, product_id: productId },
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message, code: result.error.code },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data);
}
