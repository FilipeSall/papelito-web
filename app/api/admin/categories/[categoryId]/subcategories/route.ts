import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { createSubcategory, taxonomyErrorResponse } from "@/lib/server/admin-taxonomy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const parsed = Number.parseInt((await params).categoryId, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NextResponse.json({ message: "Categoria inválida." }, { status: 422 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const subcategory = await createSubcategory(auth.accessToken, parsed, payload);
    revalidateTag("admin-taxonomy", "max");
    revalidateTag("wp:categories", "max");
    return NextResponse.json({ subcategory }, { status: 201 });
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível criar a subcategoria.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
