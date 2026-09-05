import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { readWithVendorAccessToken, requireVendorAccessToken } from "../../../_lib/require-vendor-session";

const DECLARED_FIELDS = [
  "accessKey",
  "docNumber",
  "docSeries",
  "docType",
  "issuedAt",
  "issuerCnpj",
  "issuerName",
  "notes",
  "protocol",
] as const;

/**
 * Só os campos que o WordPress conhece atravessam o proxy, já como string.
 * O que decide validade, nível e divergência continua sendo do backend — aqui
 * é apenas o formato do corpo.
 *
 * Campo presente e vazio **atravessa**: é assim que o vendor apaga um dado
 * digitado errado. Campo ausente é "não informei", e o backend preserva o que
 * já estava gravado — descartar os dois igualmente tornava o erro permanente.
 */
function declaredFromBody(body: Record<string, unknown>): Record<string, unknown> {
  const declared: Record<string, unknown> = {};

  for (const field of DECLARED_FIELDS) {
    const value = body[field];
    if (typeof value === "string") {
      declared[field] = value.trim();
    }
  }

  if (body.totalCents !== undefined) {
    const totalCents = Number(body.totalCents);
    if (Number.isInteger(totalCents) && totalCents >= 0) {
      declared.totalCents = totalCents;
    }
  }

  return declared;
}

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const declared = declaredFromBody(body ?? {});

  if (Object.keys(declared).length === 0) {
    return NextResponse.json({ message: "Informe ao menos um dado da nota fiscal." }, { status: 422 });
  }

  const result = await wpRest<unknown>(`/papelito/v1/vendor/me/orders/${id}/fiscal-document`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: declared,
    method: "POST",
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
