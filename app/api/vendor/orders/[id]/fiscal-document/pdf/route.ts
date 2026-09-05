import { NextResponse } from "next/server";

import { getWpRestBase } from "@/lib/server/env";

import { requireVendorAccessToken } from "../../../../_lib/require-vendor-session";

/**
 * Espelho da nota em PDF, no mesmo desenho do recibo do comprador.
 *
 * `?download=1` força o anexo; sem ele o PDF volta `inline`, para a tela poder
 * exibi-lo sem obrigar o vendor a baixar.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  const base = getWpRestBase().replace(/\/$/, "");
  let response: Response;

  try {
    response = await fetch(
      `${base}/papelito/v1/vendor/me/orders/${id}/fiscal-document/pdf${download ? "?download=1" : ""}`,
      {
        cache: "no-store",
        headers: { Accept: "application/pdf", Authorization: `Bearer ${auth.accessToken}` },
      },
    );
  } catch {
    return NextResponse.json({ message: "Não foi possível gerar o PDF da nota." }, { status: 502 });
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    return NextResponse.json(
      {
        code: error?.code ?? "papelito_fiscal_pdf_error",
        message: error?.message ?? "PDF da nota indisponível.",
      },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        `${download ? "attachment" : "inline"}; filename="espelho-nota-pedido-${id}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
