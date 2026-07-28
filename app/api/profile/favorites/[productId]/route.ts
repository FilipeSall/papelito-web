import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { removeFavoriteProduct } from "@/features/favorites";
import { authOptions } from "@/lib/auth";

interface FavoriteRouteProps {
  params: Promise<{
    productId: string;
  }>;
}

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

export async function DELETE(_request: Request, { params }: FavoriteRouteProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { productId } = await params;
  const numericId = Number(productId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 422 });
  }

  try {
    const result = await removeFavoriteProduct(session.accessToken, numericId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível remover o produto dos favoritos.";
    return NextResponse.json({ message }, { status: resolveFavoritesStatus(error) });
  }
}
