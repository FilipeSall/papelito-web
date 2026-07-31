import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  getAdminProduct,
  updateAdminProduct,
  type AdminProductPayload,
} from "@/lib/server/admin-products";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { productId } = await params;
  const parsedProductId = Number.parseInt(productId, 10);

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 422 });
  }

  const payload = (await request.json().catch(() => null)) as AdminProductPayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const product = await updateAdminProduct(auth.accessToken, parsedProductId, payload);
    revalidateTag("admin-products", "max");
    revalidateTag("wp:products", "max");
    revalidateTag("wp:categories", "max");
    revalidateTag(`wp:product:${parsedProductId}`, "max");
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o produto.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { productId } = await params;
  const parsedProductId = Number.parseInt(productId, 10);

  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 422 });
  }

  try {
    const product = await getAdminProduct(auth.accessToken, parsedProductId);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar o produto.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
