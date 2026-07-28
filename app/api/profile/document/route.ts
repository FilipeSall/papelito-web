import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { updateProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";

type DocumentPayload = {
  document?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as DocumentPayload | null;
  const digits = String(payload?.document ?? "").replace(/\D/g, "");

  if (digits.length !== 11 && digits.length !== 14) {
    return NextResponse.json(
      { message: "Informe um CPF ou CNPJ válido." },
      { status: 422 },
    );
  }

  const metaKey = digits.length === 14 ? "cnpj" : "cpf";

  try {
    const customer = await updateProfileCustomer(session.accessToken, {
      metaData: [{ key: metaKey, value: digits }],
    });

    return NextResponse.json({ customer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o documento.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
