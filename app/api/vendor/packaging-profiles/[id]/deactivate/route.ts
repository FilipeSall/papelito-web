import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function parseProfileId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Desativa um perfil sem removê-lo do WordPress.
 *
 * @param _request Requisição do navegador.
 * @param context Parâmetros dinâmicos da rota.
 * @returns Resposta do WordPress.
 */
export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id: rawId } = await params;
  const id = parseProfileId(rawId);
  if (id === null) {
    return NextResponse.json({ message: "Caixa inválida." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/packaging-profiles/${id}/deactivate`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "POST",
  });

  if (!result.ok) {
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

  revalidateTag("vendor-packaging", "max");
  revalidateTag("vendor-eligibility", "max");
  revalidatePath("/vendor/cubagem");
  return NextResponse.json(result.data);
}
