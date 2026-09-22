import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

type RouteContext = { params: Promise<{ id: string }> };

function wpPath(vendorId: number) {
  return `/papelito/v1/admin/vendors/${vendorId}/integrations/braspress`;
}

function failure(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

async function resolveVendorId(context: RouteContext) {
  const { id } = await context.params;
  const vendorId = Number.parseInt(id, 10);

  return Number.isFinite(vendorId) && vendorId > 0 ? vendorId : 0;
}

async function forward(vendorId: number, accessToken: string, method: "PUT" | "DELETE", json?: unknown) {
  const result = await wpRest<Record<string, unknown>>(wpPath(vendorId), {
    headers: { Authorization: `Bearer ${accessToken}` },
    json,
    method,
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data);
}

/**
 * Grava a configuração Braspress de um vendor em nome da operação.
 *
 * A validação dos campos é do WordPress — repeti-la aqui criaria uma segunda
 * regra que envelheceria sozinha. Esta rota confere a sessão administrativa,
 * repassa o corpo e devolve a recusa do backend como veio.
 *
 * @param request Requisição do painel administrativo.
 * @param context Parâmetros da rota, com o id do vendor.
 * @returns Estado público da integração, ou a recusa do WordPress.
 */
export async function PUT(request: Request, context: RouteContext) {
  const auth = await getAdminApiSession();

  if ("error" in auth) return failure(auth.status, auth.error);

  const vendorId = await resolveVendorId(context);

  if (!vendorId) return failure(400, "Vendor inválido.");

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body || typeof body !== "object") {
    return failure(400, "Informe os dados da integração.");
  }

  return forward(vendorId, auth.accessToken, "PUT", body);
}

/**
 * Remove a integração Braspress de um vendor, apagando a credencial guardada.
 *
 * @param _request Requisição do painel administrativo, sem corpo.
 * @param context Parâmetros da rota, com o id do vendor.
 * @returns Estado vazio da integração, ou a recusa do WordPress.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAdminApiSession();

  if ("error" in auth) return failure(auth.status, auth.error);

  const vendorId = await resolveVendorId(context);

  if (!vendorId) return failure(400, "Vendor inválido.");

  return forward(vendorId, auth.accessToken, "DELETE");
}
