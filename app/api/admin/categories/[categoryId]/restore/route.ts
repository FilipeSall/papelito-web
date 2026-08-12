import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { restoreCategory } from "@/lib/server/admin-taxonomy";

export async function POST(
  _request: Request,
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

  try {
    const category = await restoreCategory(auth.accessToken, parsed);
    revalidateTag("admin-taxonomy", "max");
    revalidateTag("wp:categories", "max");
    return NextResponse.json({ category });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível restaurar a categoria.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
