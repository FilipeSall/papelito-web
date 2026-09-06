import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { reorderCollections, taxonomyErrorResponse } from "@/lib/server/admin-taxonomy";

import { invalidateCollections } from "../invalidate";

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(payload?.ids)
    ? payload.ids.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ message: "Informe a ordem das coleções." }, { status: 400 });
  }

  try {
    const snapshot = await reorderCollections(auth.accessToken, ids);
    invalidateCollections();
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível reordenar as coleções.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
