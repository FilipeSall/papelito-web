import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { PRODUCT_IMPORT_MAX_ROWS } from "@/features/admin-product-import/types/admin-product-import";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

const RESPONSE_HEADERS = { "Cache-Control": "private, no-store" };
const TOKEN_LIMIT = 80;
const BODY_KEYS = new Set(["token", "createLines", "acknowledgeRepeat"]);

type ConfirmBody = { token: string; createLines: number[]; acknowledgeRepeat: boolean };

function errorResponse(message: string, status: number, code?: string) {
  return NextResponse.json(code ? { message, code } : { message }, { status, headers: RESPONSE_HEADERS });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConfirmBody(body: unknown): body is ConfirmBody {
  return isRecord(body)
    && Object.keys(body).every((key) => BODY_KEYS.has(key))
    && typeof body.token === "string"
    && body.token.length > 0
    && body.token.length <= TOKEN_LIMIT
    && Array.isArray(body.createLines)
    && body.createLines.length <= PRODUCT_IMPORT_MAX_ROWS
    && body.createLines.every((line) => Number.isSafeInteger(line) && Number(line) > 0)
    && typeof body.acknowledgeRepeat === "boolean";
}

/**
 * Confirma a importação de produtos e cria o lote no WordPress.
 * O corpo leva só o token da conferência e as decisões; as linhas ficaram no servidor e são
 * reanalisadas lá. O prazo é o da importação do vendor (60 s): um lote que passe dele responde
 * erro aqui mesmo que o WordPress termine, e a Atividade recente mostra o desfecho real.
 */
export async function POST(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return errorResponse(auth.error, auth.status);
  const body: unknown = await request.json().catch(() => null);
  if (!isConfirmBody(body)) return errorResponse("Confirmação da importação fora do formato esperado.", 422);
  const result = await wpRest<unknown>("/papelito/v1/admin/products/import", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { token: body.token, createLines: body.createLines, acknowledgeRepeat: body.acknowledgeRepeat },
    timeoutMs: 60_000,
  });
  if (!result.ok) {
    return errorResponse(result.error.message, result.status >= 400 ? result.status : 502, result.error.code);
  }
  revalidatePath("/admin/products");
  revalidatePath("/admin/relatorios");
  return NextResponse.json(result.data, { status: 201, headers: RESPONSE_HEADERS });
}
