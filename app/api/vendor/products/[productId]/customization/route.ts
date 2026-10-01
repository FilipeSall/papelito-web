import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = { params: Promise<{ productId: string }> };
const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

async function forward(request: Request, context: RouteContext, method: "GET" | "PUT" | "DELETE") {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status, headers: RESPONSE_HEADERS });
  }
  const { productId } = await context.params;
  if (!/^[1-9]\d*$/.test(productId) || !Number.isSafeInteger(Number(productId))) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 400, headers: RESPONSE_HEADERS });
  }
  const body: unknown = method === "PUT" ? await request.json().catch(() => null) : undefined;
  if (method === "PUT" && (typeof body !== "object" || body === null || Array.isArray(body) || Object.keys(body).length !== 1 || !("description" in body) || typeof body.description !== "string")) {
    return NextResponse.json({ message: "Envie somente uma descrição em texto." }, { status: 422, headers: RESPONSE_HEADERS });
  }
  const result = await wpRest<unknown>("/papelito/v1/vendor/me/products/" + productId + "/customization", {
    method,
    headers: { Authorization: "Bearer " + auth.accessToken },
    ...(method === "PUT" ? { json: body } : {}),
  });
  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status >= 400 ? result.status : 502, headers: RESPONSE_HEADERS });
  }
  if (method !== "GET") {
    revalidateTag("vendor-stock", { expire: 0 });
    revalidatePath("/vendor/estoque");
  }
  return NextResponse.json(result.data, { headers: RESPONSE_HEADERS });
}

/** Lê a personalização com token mantido somente no servidor. */
export function GET(request: Request, context: RouteContext) { return forward(request, context, "GET"); }

/** Atualiza exclusivamente a descrição e expira o indicador do estoque. */
export function PUT(request: Request, context: RouteContext) { return forward(request, context, "PUT"); }

/** Restaura por remoção do override, preservando os contratos do catálogo. */
export function DELETE(request: Request, context: RouteContext) { return forward(request, context, "DELETE"); }
