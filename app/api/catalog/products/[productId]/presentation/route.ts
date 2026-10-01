import { NextResponse } from "next/server";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = { params: Promise<{ productId: string }> };
const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

/** Seletor público de leitura; não autoriza edição nem divulga o contrato de gestão. */
export async function GET(request: Request, { params }: RouteContext) {
  const { productId } = await params;
  const query = new URL(request.url).searchParams;
  const rawVendor = query.get("vendor_id");
  const ids = rawVendor === null ? [productId] : [productId, rawVendor];
  if (ids.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) {
    return NextResponse.json({ message: "Produto ou vendor inválido." }, { status: 400, headers: RESPONSE_HEADERS });
  }
  const result = await wpRest<unknown>("/papelito/v1/products/" + productId + "/presentation" + (rawVendor === null ? "" : "?vendor_id=" + rawVendor));
  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status >= 400 ? result.status : 502, headers: RESPONSE_HEADERS });
  }
  return NextResponse.json(result.data, { headers: RESPONSE_HEADERS });
}
