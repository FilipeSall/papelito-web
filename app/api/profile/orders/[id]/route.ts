import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getProfileOrderDetail } from "@/features/orders";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const order = await getProfileOrderDetail(id);

  if (!order) {
    return NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
  }

  return NextResponse.json(order);
}
