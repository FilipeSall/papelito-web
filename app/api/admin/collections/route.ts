import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  createCollection,
  getAdminCollections,
  taxonomyErrorResponse,
} from "@/lib/server/admin-taxonomy";

import { invalidateCollections } from "./invalidate";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminCollections);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await createCollection(auth.accessToken, payload);
    invalidateCollections();
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível criar a coleção.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
