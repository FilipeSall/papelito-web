import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

/** Mesmo teto do WordPress: acima disso a escrita passaria do tempo limite no meio do lote. */
const MAX_SELECTION = 200;

type BulkBody = { product_ids?: unknown; qty?: unknown };

/**
 * Aplica uma quantidade a vários produtos em uma requisição.
 *
 * O lote existe para a rede, não para a autorização: quem decide se o vendor pode escrever
 * continua sendo o WordPress, produto por produto.
 */
export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as BulkBody | null;
  const qty = Number(body?.qty);
  const productIds = Array.isArray(body?.product_ids)
    ? Array.from(
        new Set(
          body.product_ids
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      )
    : [];

  if (!Number.isInteger(qty) || qty < 0) {
    return NextResponse.json(
      { message: "Informe uma quantidade inteira igual ou maior que zero." },
      { status: 400 },
    );
  }

  if (productIds.length === 0) {
    return NextResponse.json({ message: "Selecione ao menos um produto." }, { status: 400 });
  }

  if (productIds.length > MAX_SELECTION) {
    return NextResponse.json(
      { message: `Selecione no máximo ${MAX_SELECTION} produtos por vez.` },
      { status: 422 },
    );
  }

  const result = await wpRest<{ failed?: unknown[]; updated?: number }>(
    "/papelito/v1/vendor/me/stock/bulk",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      json: { product_ids: productIds, qty },
    },
  );

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message, code: result.error.code },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-stock", "max");
  revalidateTag("vendor-kpis", "max");
  revalidatePath("/vendor/estoque");
  revalidatePath("/vendor/dashboard");

  return NextResponse.json(result.data);
}
