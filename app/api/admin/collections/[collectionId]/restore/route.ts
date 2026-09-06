import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { restoreCollection, taxonomyErrorResponse } from "@/lib/server/admin-taxonomy";

import { invalidateCollections } from "../../invalidate";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const parsed = Number.parseInt((await params).collectionId, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return NextResponse.json({ message: "Coleção inválida." }, { status: 422 });
  }

  try {
    const snapshot = await restoreCollection(auth.accessToken, parsed);
    invalidateCollections();
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível restaurar a coleção.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
