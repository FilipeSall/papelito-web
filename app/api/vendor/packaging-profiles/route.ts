import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { readWithVendorAccessToken, requireVendorAccessToken } from "../_lib/require-vendor-session";

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
 * Lista os perfis do vendor autenticado via WordPress.
 *
 * @returns Resposta com perfis ativos e inativos.
 */
export async function GET() {
  const session = await readWithVendorAccessToken((accessToken) =>
    wpRest<unknown>("/papelito/v1/vendor/me/packaging-profiles", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  return session.data.ok ? NextResponse.json(session.data.data) : errorResponse(session.data);
}

/**
 * Cria um perfil encaminhando o corpo ao WordPress autenticado.
 *
 * @param request Requisição do navegador.
 * @returns Resposta do WordPress.
 */
export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body: unknown = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ message: "Informe os dados da caixa." }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/packaging-profiles", {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
    method: "POST",
  });

  if (!result.ok) return errorResponse(result);

  revalidateTag("vendor-packaging", "max");
  revalidatePath("/vendor/cubagem");
  return NextResponse.json(result.data, { status: 201 });
}
