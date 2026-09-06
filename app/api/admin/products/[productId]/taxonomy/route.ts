import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getProductTaxonomy,
  saveProductTaxonomy,
  taxonomyErrorResponse,
} from "@/lib/server/admin-taxonomy";

function parseId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const productId = parseId((await params).productId);

  if (productId === null) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 422 });
  }

  const session = await readWithAdminApiSession((accessToken) =>
    getProductTaxonomy(accessToken, productId),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const taxonomy = session.data;

  if (!taxonomy) {
    return NextResponse.json(
      { message: "Não foi possível carregar a taxonomia do produto." },
      { status: 502 },
    );
  }

  return NextResponse.json({ taxonomy });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const productId = parseId((await params).productId);

  if (productId === null) {
    return NextResponse.json({ message: "Produto inválido." }, { status: 422 });
  }

  const payload = (await request.json().catch(() => null)) as {
    categoryId?: unknown;
    collections?: unknown;
    subcategoryIds?: unknown;
  } | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const taxonomy = await saveProductTaxonomy(auth.accessToken, productId, {
      ...(typeof payload.categoryId === "number"
        ? { categoryId: payload.categoryId }
        : {}),
      ...(Array.isArray(payload.subcategoryIds)
        ? { subcategoryIds: payload.subcategoryIds.map(Number) }
        : {}),
      ...(Array.isArray(payload.collections)
        ? { collections: payload.collections.map(String) }
        : {}),
    });

    // O catálogo lê a taxonomia Papelito: reclassificar um produto muda a vitrine.
    revalidateTag("admin-taxonomy", "max");
    revalidateTag("wp:categories", "max");
    revalidateTag("wp:products", "max");
    revalidateTag(`wp:product:${productId}`, "max");
    revalidatePath("/premium");
    revalidatePath("/colecoes");

    return NextResponse.json({ taxonomy });
  } catch (error) {
    // Sem o erro tipado, uma recusa de regra (422 de coleção inativa, 422 de
    // subcategoria de outra categoria) virava 500 e o painel dizia "não foi
    // possível salvar" sem contar o motivo.
    const response = taxonomyErrorResponse(
      error,
      "Não foi possível salvar a classificação do produto.",
    );

    return NextResponse.json(
      { ...response.body, message: response.body.message },
      { status: response.status },
    );
  }
}
