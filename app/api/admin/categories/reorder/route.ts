import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { reorderCategories } from "@/lib/server/admin-taxonomy";

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(payload?.ids)
    ? payload.ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ message: "Informe ao menos uma categoria." }, { status: 422 });
  }

  try {
    const result = await reorderCategories(auth.accessToken, ids);
    revalidateTag("admin-taxonomy", "max");
    revalidateTag("wp:categories", "max");
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível reordenar as categorias.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
