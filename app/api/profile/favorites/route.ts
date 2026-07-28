import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { addFavoriteProduct, fetchFavorites } from "@/features/favorites";
import { authOptions } from "@/lib/auth";

type FavoritePayload = {
  productId?: number | string;
};

function resolveFavoritesStatus(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("nao autenticado") ||
    normalized.includes("não autenticado") ||
    normalized.includes("not authorized") ||
    normalized.includes("token") ||
    normalized.includes("jwt")
  ) {
    return 401;
  }

  return 500;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  try {
    const favorites = await fetchFavorites(session.accessToken);
    return NextResponse.json(favorites);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível carregar os favoritos.";
    return NextResponse.json({ message }, { status: resolveFavoritesStatus(error) });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as FavoritePayload | null;
  const productId = Number(payload?.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 422 });
  }

  try {
    const result = await addFavoriteProduct(session.accessToken, productId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível favoritar o produto.";
    return NextResponse.json({ message }, { status: resolveFavoritesStatus(error) });
  }
}
