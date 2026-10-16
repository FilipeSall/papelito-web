import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { SKU_IMPORT_MAX_ROWS } from "@/features/vendor-sku-import/types/vendor-sku-import";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };
const RAW_TEXT_LIMIT = 400;
const ROW_KEYS = new Set(["line", "description", "subgroup", "code", "family_id", "expected"]);

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(code ? { message, code } : { message }, { status, headers: RESPONSE_HEADERS });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInt(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function isShortText(value: unknown) {
  return typeof value === "string" && value.length <= RAW_TEXT_LIMIT;
}

function isExpected(value: unknown) {
  return isRecord(value)
    && isPositiveInt(value.product_id)
    && (value.current_code === null || isShortText(value.current_code));
}

function isConfirmRow(value: unknown) {
  return isRecord(value)
    && Object.keys(value).every((key) => ROW_KEYS.has(key))
    && isPositiveInt(value.line)
    && isPositiveInt(value.family_id)
    && isShortText(value.description)
    && isShortText(value.subgroup)
    && isShortText(value.code)
    && Array.isArray(value.expected)
    && value.expected.every(isExpected);
}

function isConfirmBody(body: unknown): body is { rows: unknown[] } {
  return isRecord(body)
    && Object.keys(body).length === 1
    && Array.isArray(body.rows)
    && body.rows.length > 0
    && body.rows.length <= SKU_IMPORT_MAX_ROWS
    && body.rows.every(isConfirmRow);
}

/**
 * Confirma a importação de códigos do vendor e expira a listagem de estoque.
 * Identidade vem só do token do servidor; o WordPress refaz a associação de cada linha e só
 * grava o que ainda bate com a prévia, então o corpo é conferido aqui apenas na forma.
 */
export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return errorResponse(auth.error, auth.status);
  const body: unknown = await request.json().catch(() => null);
  if (!isConfirmBody(body)) return errorResponse("Linhas da importação fora do formato esperado.", 422);
  const result = await wpRest<unknown>("/papelito/v1/vendor/me/products/vendor-codes/import", {
    method: "POST",
    headers: { Authorization: "Bearer " + auth.accessToken },
    json: { rows: body.rows },
    timeoutMs: 60_000,
  });
  if (!result.ok) {
    return errorResponse(result.error.message, result.status >= 400 ? result.status : 502, result.error.code);
  }
  revalidateTag("vendor-stock", { expire: 0 });
  revalidatePath("/vendor/estoque");
  return NextResponse.json(result.data, { headers: RESPONSE_HEADERS });
}
