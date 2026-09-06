import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  archiveCollection,
  deleteCollectionPermanently,
  taxonomyErrorResponse,
  updateCollection,
} from "@/lib/server/admin-taxonomy";

import { invalidateCollections } from "../invalidate";

function parseId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const collectionId = parseId((await params).collectionId);

  if (collectionId === null) {
    return NextResponse.json({ message: "Coleção inválida." }, { status: 422 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await updateCollection(auth.accessToken, collectionId, payload);
    invalidateCollections();
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível salvar a coleção.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ collectionId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const collectionId = parseId((await params).collectionId);

  if (collectionId === null) {
    return NextResponse.json({ message: "Coleção inválida." }, { status: 422 });
  }

  const isPermanent = new URL(request.url).searchParams.get("force") === "true";

  try {
    const snapshot = isPermanent
      ? await deleteCollectionPermanently(auth.accessToken, collectionId)
      : await archiveCollection(auth.accessToken, collectionId);

    invalidateCollections();
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = taxonomyErrorResponse(
      error,
      isPermanent
        ? "Não foi possível excluir a coleção."
        : "Não foi possível arquivar a coleção.",
    );
    return NextResponse.json(response.body, { status: response.status });
  }
}
