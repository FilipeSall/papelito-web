import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  fetchRevendedorApplication,
  submitRevendedorApplication,
} from "@/features/revendedor/server/application";
import type { SubmitRevendedorApplicationInput } from "@/features/revendedor/types/revendedor-application";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const application = await fetchRevendedorApplication(session.accessToken);

  return NextResponse.json(application, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as SubmitRevendedorApplicationInput | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  try {
    const result = await submitRevendedorApplication(session.accessToken, payload);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nao foi possivel enviar sua triagem.";
    const status =
      error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 422;

    return NextResponse.json({ message }, { status });
  }
}
