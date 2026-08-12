import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  archiveSubcategory,
  taxonomyErrorResponse,
  updateSubcategory,
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
  { params }: { params: Promise<{ subcategoryId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const subcategoryId = parseId((await params).subcategoryId);

  if (subcategoryId === null) {
    return NextResponse.json({ message: "Subcategoria inválida." }, { status: 422 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const subcategory = await updateSubcategory(auth.accessToken, subcategoryId, payload);
    invalidate();
    return NextResponse.json({ subcategory });
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível salvar a subcategoria.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ subcategoryId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const subcategoryId = parseId((await params).subcategoryId);

  if (subcategoryId === null) {
    return NextResponse.json({ message: "Subcategoria inválida." }, { status: 422 });
  }

  try {
    const subcategory = await archiveSubcategory(auth.accessToken, subcategoryId);
    invalidate();
    return NextResponse.json({ subcategory });
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível arquivar a subcategoria.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
