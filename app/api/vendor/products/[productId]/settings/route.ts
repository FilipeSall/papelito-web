import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readWithVendorAccessToken, requireVendorAccessToken } from "../../../_lib/require-vendor-session";
import { wpRest, type WpRestResult } from "@/lib/server/wp-rest";

type RouteContext = { params: Promise<{ productId: string }> };
type ItemSettingsBody = { vendor_code: string | null };

const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };
const RAW_CODE_LIMIT = 240;

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(code ? { message, code } : { message }, { status, headers: RESPONSE_HEADERS });
}

async function readProductId(context: RouteContext) {
  const { productId } = await context.params;
  return /^[1-9]\d*$/.test(productId) && Number.isSafeInteger(Number(productId)) ? productId : null;
}

function isItemSettingsBody(body: unknown): body is ItemSettingsBody {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return false;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "vendor_code") return false;
  const code = (body as Record<string, unknown>).vendor_code;
  return code === null || (typeof code === "string" && code.length <= RAW_CODE_LIMIT);
}

function settingsRequest(productId: string, accessToken: string, body?: ItemSettingsBody) {
  return wpRest<unknown>("/papelito/v1/vendor/me/products/" + productId + "/settings", {
    method: body ? "PATCH" : "GET",
    headers: { Authorization: "Bearer " + accessToken },
    ...(body ? { json: body } : {}),
  });
}

function respond(result: WpRestResult<unknown>) {
  if (!result.ok) return errorResponse(result.error.message, result.status >= 400 ? result.status : 502, result.error.code);
  return NextResponse.json(result.data, { headers: RESPONSE_HEADERS });
}

/**
 * Lê o código do vendor para o item, com token mantido só no servidor.
 * O WordPress é a autoridade: confirma o papel de seller antes de devolver qualquer dado.
 */
export async function GET(_request: Request, context: RouteContext) {
  const productId = await readProductId(context);
  if (!productId) return errorResponse("Produto inválido.", 400);
  const read = await readWithVendorAccessToken((accessToken) => settingsRequest(productId, accessToken));
  if ("error" in read) return errorResponse(read.error, read.status);
  return respond(read.data);
}

/**
 * Grava só o código do vendor (`null` ou vazio remove) e expira a listagem de estoque.
 * Corpo com qualquer outro campo, inclusive identidade, é recusado antes de chegar ao WordPress.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return errorResponse(auth.error, auth.status);
  const productId = await readProductId(context);
  if (!productId) return errorResponse("Produto inválido.", 400);
  const body: unknown = await request.json().catch(() => null);
  if (!isItemSettingsBody(body)) return errorResponse("Envie somente o código do produto.", 422);
  const result = await settingsRequest(productId, auth.accessToken, body);
  if (result.ok) {
    revalidateTag("vendor-stock", { expire: 0 });
    revalidatePath("/vendor/estoque");
  }
  return respond(result);
}
