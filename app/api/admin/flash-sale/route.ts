import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  deleteAdminFlashSale,
  getAdminFlashSaleSnapshot,
  saveAdminFlashSale,
  type AdminFlashSalePayload,
} from "@/lib/server/admin-flash-sale";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

async function getAdminAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Nao autenticado.", status: 401 as const };
  }

  if (normalizeRole(session.role) !== "administrator") {
    return { error: "Acesso administrativo necessario.", status: 403 as const };
  }

  return { accessToken: session.accessToken };
}

export async function GET() {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const snapshot = await getAdminFlashSaleSnapshot(auth.accessToken);

  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as AdminFlashSalePayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminFlashSale(auth.accessToken, payload);
    revalidateTag("admin-flash-sale", "max");
    revalidateTag("wp:home-flash-sale", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel salvar a campanha.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE() {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  try {
    const snapshot = await deleteAdminFlashSale(auth.accessToken);
    revalidateTag("admin-flash-sale", "max");
    revalidateTag("wp:home-flash-sale", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel remover a campanha.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
