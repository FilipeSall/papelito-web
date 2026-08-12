import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { reorderSubcategories } from "@/lib/server/admin-taxonomy";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const categoryId = Number((await params).categoryId);
  const payload = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(payload?.ids)
    ? payload.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (!Number.isInteger(categoryId) || categoryId <= 0 || ids.length === 0) {
    return NextResponse.json({ message: "Ordem de subcategorias inválida." }, { status: 422 });
  }

  try {
    const result = await reorderSubcategories(auth.accessToken, categoryId, ids);
    revalidateTag("admin-taxonomy", "max");
    revalidateTag("wp:categories", "max");
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Não foi possível reordenar as subcategorias." },
      { status: 500 },
    );
  }
}
