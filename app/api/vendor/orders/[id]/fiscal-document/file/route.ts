import { NextResponse } from "next/server";

import { getWpRestBase } from "@/lib/server/env";

import { requireVendorAccessToken } from "../../../../_lib/require-vendor-session";

/**
 * Faz streaming do arquivo privado da nota, como a rota de etiqueta: o
 * documento vive fora do webroot e só o WordPress sabe lê-lo, então o browser
 * nunca recebe a storage key nem um caminho de disco.
 *
 * Não há id de arquivo na URL: o pedido guarda uma nota, e a nota tem um
 * arquivo só.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const base = getWpRestBase().replace(/\/$/, "");
  let response: Response;

  try {
    response = await fetch(`${base}/papelito/v1/vendor/me/orders/${id}/fiscal-document/file`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível abrir o arquivo da nota." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { code?: string; message?: string }
      | null;

    return NextResponse.json(
      {
        code: error?.code ?? "papelito_fiscal_document_error",
        message: error?.message ?? "Arquivo da nota indisponível.",
      },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition":
        response.headers.get("content-disposition") ?? `attachment; filename="nota-${id}"`,
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
