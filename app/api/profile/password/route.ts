import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { updateProfileCustomer } from "@/features/profile/server/customer";
import { authOptions } from "@/lib/auth";

type PasswordPayload = {
  password?: string;
  confirmPassword?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as PasswordPayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const password = String(payload.password ?? "");
  const confirmPassword = String(payload.confirmPassword ?? "");

  if (password.length < 8) {
    return NextResponse.json(
      { message: "A nova senha precisa ter pelo menos 8 caracteres." },
      { status: 422 },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { message: "As senhas precisam coincidir." },
      { status: 422 },
    );
  }

  try {
    await updateProfileCustomer(session.accessToken, {
      password,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel atualizar sua senha.";

    return NextResponse.json({ message }, { status: 500 });
  }
}
