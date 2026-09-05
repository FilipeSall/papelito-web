import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { getWpRestBase } from "@/lib/server/env";

/**
 * Arquivo da nota fiscal na visão do comprador.
 *
 * O comprador só lê. A autorização é do WordPress, que confere se o pedido é
 * dele antes de liberar o arquivo privado — o browser nunca recebe a storage
 * key nem um caminho de disco.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getUserApiSession();

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
    response = await fetch(`${base}/papelito/v1/profile/me/orders/${id}/fiscal-document/file`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível abrir a nota fiscal." }, { status: 502 });
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    return NextResponse.json(
      {
        code: error?.code ?? "papelito_fiscal_document_error",
        message: error?.message ?? "Nota fiscal indisponível.",
      },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": response.headers.get("content-disposition") ?? `attachment; filename="nota-${id}"`,
      "Content-Type": response.headers.get("content-type") ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
