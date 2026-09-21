import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function parseProfileId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function errorResponse(result: Extract<Awaited<ReturnType<typeof wpRest>>, { ok: false }>) {
  const field = result.error.data?.field;
  return NextResponse.json(
    {
      code: result.error.code,
      ...(typeof field === "string" ? { field } : {}),
      message: result.error.message,
    },
    { status: result.status || 502 },
  );
}

/**
 * Atualiza um perfil pertencente ao vendor autenticado.
 *
 * @param request Requisição do navegador.
 * @param context Parâmetros dinâmicos da rota.
 * @returns Resposta do WordPress.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id: rawId } = await params;
  const id = parseProfileId(rawId);
  if (id === null) {
    return NextResponse.json({ message: "Caixa inválida." }, { status: 400 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ message: "Informe os dados da caixa." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/packaging-profiles/${id}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "PUT",
  });

  if (!result.ok) return errorResponse(result);

  revalidateTag("vendor-packaging", "max");
  revalidateTag("vendor-eligibility", "max");
  revalidatePath("/vendor/cubagem");
  return NextResponse.json(result.data);
}

/**
 * Apaga em definitivo uma caixa já desativada do vendor autenticado.
 *
 * O WordPress recusa a exclusão de caixa ativa: a que está em uso sai por desativação, que
 * preserva a linha e permite a volta.
 *
 * @param _request Requisição do navegador.
 * @param context Parâmetros dinâmicos da rota.
 * @returns Resposta do WordPress.
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id: rawId } = await params;
  const id = parseProfileId(rawId);
  if (id === null) {
    return NextResponse.json({ message: "Caixa inválida." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/packaging-profiles/${id}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "DELETE",
  });

  if (!result.ok) {
    return errorResponse(result);
  }

  revalidateTag("vendor-packaging", "max");
  revalidateTag("vendor-eligibility", "max");
  revalidatePath("/vendor/cubagem");
  return NextResponse.json(result.data);
}
