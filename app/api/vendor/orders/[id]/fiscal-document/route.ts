import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { readWithVendorAccessToken, requireVendorAccessToken } from "../../../_lib/require-vendor-session";

/**
 * Bloco de nota fiscal do pedido.
 *
 * A nota é só o arquivo: não há campo digitado para gravar, então não existe
 * `POST` aqui. Anexar e substituir acontecem pelo upload direto ao WordPress,
 * que devolve o mesmo bloco.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const session = await readWithVendorAccessToken((accessToken) =>
    wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/fiscal-document`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = session.data;

  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json(
        { code: result.error.code, message: result.error.message },
        { status: result.status || 502 },
      );
}

/**
 * Remove a nota do pedido: some a linha e some o arquivo do disco.
 *
 * A trilha permanece — é o único rastro de que existiu uma nota ali.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/fiscal-document`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "DELETE",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-orders", "max");
  revalidatePath(`/vendor/pedidos/${id}`);
  revalidatePath("/vendor/pedidos");

  return NextResponse.json(result.data);
}
