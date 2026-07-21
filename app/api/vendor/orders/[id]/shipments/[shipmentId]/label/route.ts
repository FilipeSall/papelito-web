import { NextResponse } from "next/server";

import { getWpRestBase } from "@/lib/server/env";

import { requireVendorAccessToken } from "../../../../../_lib/require-vendor-session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; shipmentId: string }> },
) {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id, shipmentId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(shipmentId)) {
    return NextResponse.json({ message: "Envio invalido." }, { status: 400 });
  }

  const base = getWpRestBase().replace(/\/$/, "");
  let response: Response;
  try {
    response = await fetch(
      `${base}/papelito/v1/vendor/me/orders/${id}/shipments/${shipmentId}/label`,
      {
        cache: "no-store",
        headers: { Accept: "application/pdf", Authorization: `Bearer ${auth.accessToken}` },
      },
    );
  } catch {
    return NextResponse.json({ message: "Nao foi possivel consultar a etiqueta." }, { status: 502 });
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;
    return NextResponse.json(
      { code: error?.code ?? "papelito_label_error", message: error?.message ?? "Etiqueta indisponivel." },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": response.headers.get("content-disposition") ?? `inline; filename="etiqueta-${shipmentId}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
