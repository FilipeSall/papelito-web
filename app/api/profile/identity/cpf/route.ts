import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";
import { isValidCpf } from "@/lib/validation/brazilian-documents";

type ChangeCpfPayload = {
  currentPassword?: string;
  cpf?: string;
};

type CompanyContextResponse = {
  cpfLast4?: string | null;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request
    .json()
    .catch(() => null)) as ChangeCpfPayload | null;
  const currentPassword =
    typeof payload?.currentPassword === "string" ? payload.currentPassword : "";
  const cpf = typeof payload?.cpf === "string" ? payload.cpf : "";

  if (!currentPassword) {
    return NextResponse.json(
      { message: "Informe sua senha atual." },
      { status: 422 },
    );
  }

  if (!isValidCpf(cpf)) {
    return NextResponse.json(
      { message: "Informe um CPF válido." },
      { status: 422 },
    );
  }

  try {
    const result = await wpRest<CompanyContextResponse>(
      "/papelito/v1/identity/cpf/change",
      {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        json: { currentPassword, cpf },
        method: "POST",
      },
    );

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status || 502 });
    }

    return NextResponse.json({ cpfLast4: result.data.cpfLast4 ?? null });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível alterar seu CPF." },
      { status: 500 },
    );
  }
}
