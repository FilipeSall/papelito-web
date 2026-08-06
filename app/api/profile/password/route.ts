import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

type PasswordPayload = {
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
};

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as PasswordPayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const confirmPassword = typeof payload.confirmPassword === "string" ? payload.confirmPassword : "";

  if (!currentPassword) {
    return NextResponse.json(
      { message: "Informe sua senha atual." },
      { status: 422 },
    );
  }

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
    const result = await wpRest<{ ok: true }>("/papelito/v1/auth/change-password", {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      json: {
        currentPassword,
        password,
        confirmPassword,
      },
      method: "POST",
    });

    if (!result.ok) {
      return NextResponse.json(result.error, { status: result.status || 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível atualizar sua senha." },
      { status: 500 },
    );
  }
}
