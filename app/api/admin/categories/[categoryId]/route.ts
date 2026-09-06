import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  archiveCategory,
  deleteCategoryPermanently,
  taxonomyErrorResponse,
  updateCategory,
} from "@/lib/server/admin-taxonomy";

function parseId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function invalidate() {
  revalidateTag("admin-taxonomy", "max");
  revalidateTag("wp:categories", "max");
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const categoryId = parseId((await params).categoryId);

  if (categoryId === null) {
    return NextResponse.json({ message: "Categoria inválida." }, { status: 422 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const category = await updateCategory(auth.accessToken, categoryId, payload);
    invalidate();
    return NextResponse.json({ category });
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível salvar a categoria.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const categoryId = parseId((await params).categoryId);

  if (categoryId === null) {
    return NextResponse.json({ message: "Categoria inválida." }, { status: 422 });
  }

  const isPermanent = new URL(request.url).searchParams.get("force") === "true";

  try {
    if (isPermanent) {
      const taxonomy = await deleteCategoryPermanently(auth.accessToken, categoryId);
      invalidate();
      return NextResponse.json(taxonomy);
    }

    const category = await archiveCategory(auth.accessToken, categoryId);
    invalidate();
    return NextResponse.json({ category });
  } catch (error) {
    const response = taxonomyErrorResponse(
      error,
      isPermanent
        ? "Não foi possível excluir a categoria."
        : "Não foi possível arquivar a categoria.",
    );
    return NextResponse.json(response.body, { status: response.status });
  }
}
