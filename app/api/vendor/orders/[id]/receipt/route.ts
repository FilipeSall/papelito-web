import { NextResponse } from "next/server";

import { getWpRestBase } from "@/lib/server/env";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

/**
 * Recibo do pagamento anexado ao pedido, na visão do vendor.
 *
 * É o mesmo PDF que o comprador baixa, gerado do mesmo recibo persistido —
 * o vendor só o alcança por outra autorização. `?download=1` força o anexo.
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
      `${base}/papelito/v1/vendor/me/orders/${id}/receipt${download ? "?download=1" : ""}`,
      {
        cache: "no-store",
        headers: { Accept: "application/pdf", Authorization: `Bearer ${auth.accessToken}` },
      },
    );
  } catch {
    return NextResponse.json({ message: "Não foi possível abrir o recibo." }, { status: 502 });
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    return NextResponse.json(
      { code: error?.code ?? "papelito_receipt_error", message: error?.message ?? "Recibo indisponível." },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        `${download ? "attachment" : "inline"}; filename="recibo-pedido-${id}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
