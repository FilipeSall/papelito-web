import { NextResponse } from "next/server";

import { getWpRestBase } from "@/lib/server/env";

import { requireVendorAccessToken } from "../../../_lib/require-vendor-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  // `download=1` separa ver de baixar: sem ele o WordPress devolve o PDF
  // `inline`, que é o que o visualizador da tela embute num frame.
  const download = new URL(request.url).searchParams.get("download") === "1";
  const base = getWpRestBase().replace(/\/$/, "");
  let response: Response;

  try {
    response = await fetch(`${base}/papelito/v1/vendor/me/orders/${id}/refund-receipt${download ? "?download=1" : ""}`, {
      cache: "no-store",
      headers: { Accept: "application/pdf", Authorization: `Bearer ${auth.accessToken}` },
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível abrir o recibo de estorno." }, { status: 502 });
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    return NextResponse.json(
      { code: error?.code ?? "papelito_order_refund_receipt_error", message: error?.message ?? "Recibo de estorno indisponível." },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition":
        response.headers.get("content-disposition") ??
        `${download ? "attachment" : "inline"}; filename="recibo-estorno-pedido-${id}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
