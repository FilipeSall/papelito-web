import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

export const dynamic = "force-dynamic";

const PATH = "/papelito/v1/profile/me/refund-pix-key";
const KEY_TYPES = new Set(["cpf", "cnpj", "email", "telefone", "aleatoria"]);
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

type RefundPixKeyResponse = {
  pixKey: { holderName: string; hint: string; type: string; updatedAt: string } | null;
};

function failure(result: { error: { code?: string; message: string }; status: number }) {
  return NextResponse.json(
    { code: result.error.code, message: result.error.message },
    { status: result.status || 502 },
  );
}

/** A chave nunca volta inteira: o WordPress devolve só a pista e o titular. */
export async function GET() {
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = await wpRest<RefundPixKeyResponse>(PATH, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  return result.ok ? NextResponse.json(result.data, { headers: NO_STORE }) : failure(result);
}

export async function PUT(request: Request) {
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const type = typeof body?.type === "string" ? body.type : "";
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  const holderName = typeof body?.holderName === "string" ? body.holderName.trim() : "";

  if (!KEY_TYPES.has(type) || key === "" || holderName === "") {
    return NextResponse.json({ message: "Informe o tipo, a chave e o titular." }, { status: 422 });
  }

  const result = await wpRest<RefundPixKeyResponse>(PATH, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    json: { holderName, key, type },
    method: "PUT",
  });

  return result.ok ? NextResponse.json(result.data, { headers: NO_STORE }) : failure(result);
}

export async function DELETE() {
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = await wpRest<RefundPixKeyResponse>(PATH, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    method: "DELETE",
  });

  return result.ok ? NextResponse.json(result.data, { headers: NO_STORE }) : failure(result);
}
