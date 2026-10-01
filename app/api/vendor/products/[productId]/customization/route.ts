import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { readWithVendorAccessToken, requireVendorAccessToken } from "../../../_lib/require-vendor-session";
import { wpRest, type WpRestResult } from "@/lib/server/wp-rest";

type RouteContext = { params: Promise<{ productId: string }> };
type Method = "GET" | "PUT";
const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(code ? { message, code } : { message }, { status, headers: RESPONSE_HEADERS });
}

async function readProductId(context: RouteContext) {
  const { productId } = await context.params;
  return /^[1-9]\d*$/.test(productId) && Number.isSafeInteger(Number(productId)) ? productId : null;
}

type DescriptionBody = { description: string; use_vendor_description?: boolean };
const DESCRIPTION_BODY_KEYS = new Set(["description", "use_vendor_description"]);

function isDescriptionBody(body: unknown): body is DescriptionBody {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return false;
  if (!Object.keys(body).every((key) => DESCRIPTION_BODY_KEYS.has(key))) return false;
  const choice = (body as Record<string, unknown>).use_vendor_description;
  return "description" in body && typeof body.description === "string" && (choice === undefined || typeof choice === "boolean");
}

function customizationRequest(productId: string, accessToken: string, method: Method, body?: DescriptionBody) {
  return wpRest<unknown>("/papelito/v1/vendor/me/products/" + productId + "/customization", {
    method,
    headers: { Authorization: "Bearer " + accessToken },
    ...(body ? { json: body } : {}),
  });
}

function respond(result: WpRestResult<unknown>) {
  if (!result.ok) return errorResponse(result.error.message, result.status >= 400 ? result.status : 502, result.error.code);
  return NextResponse.json(result.data, { headers: RESPONSE_HEADERS });
}

async function mutate(request: Request, context: RouteContext) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return errorResponse(auth.error, auth.status);
  const productId = await readProductId(context);
  if (!productId) return errorResponse("Produto inválido.", 400);
  const body: unknown = await request.json().catch(() => null);
  if (!isDescriptionBody(body)) return errorResponse("Envie somente uma descrição em texto.", 422);
  const result = await customizationRequest(productId, auth.accessToken, "PUT", body);
  if (result.ok) {
    revalidateTag("vendor-stock", { expire: 0 });
    revalidatePath("/vendor/estoque");
  }
  return respond(result);
}

/**
 * Lê a personalização com token mantido somente no servidor.
 * A checagem de papel e a leitura correm em paralelo; nada sai antes de o
 * WordPress confirmar que o token é de seller.
 */
export async function GET(_request: Request, context: RouteContext) {
  const productId = await readProductId(context);
  if (!productId) return errorResponse("Produto inválido.", 400);
  const read = await readWithVendorAccessToken((accessToken) => customizationRequest(productId, accessToken, "GET"));
  if ("error" in read) return errorResponse(read.error, read.status);
  return respond(read.data);
}

/** Atualiza exclusivamente a descrição e expira o indicador do estoque. */
export function PUT(request: Request, context: RouteContext) { return mutate(request, context); }
