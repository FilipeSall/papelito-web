import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  createAdminProductTag,
  type AdminProductTagPayload,
} from "@/lib/server/admin-products";

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

export async function POST(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as AdminProductTagPayload | null;

  if (!payload?.name?.trim()) {
    return NextResponse.json({ message: "Nome da tag e obrigatorio." }, { status: 422 });
  }

  try {
    const tag = await createAdminProductTag(auth.accessToken, payload);
    revalidateTag("admin-product-taxonomies", "max");
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar a tag.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
