import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  createAdminProduct,
  getAdminProductsSnapshot,
  type AdminProductPayload,
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

export async function GET(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const snapshot = await getAdminProductsSnapshot(auth.accessToken, {
    category: url.searchParams.get("category") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    stockStatus: url.searchParams.get("stockStatus") ?? undefined,
  });

  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as AdminProductPayload | null;

  if (!payload || !payload.name?.trim()) {
    return NextResponse.json(
      { message: "Nome do produto e obrigatorio." },
      { status: 422 },
    );
  }

  try {
    const product = await createAdminProduct(auth.accessToken, {
      ...payload,
      status: payload.status || "draft",
    });
    revalidateTag("admin-products", "max");
    revalidateTag("wp:products", "max");
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o produto.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
