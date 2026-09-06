import { NextResponse } from "next/server";

import {
  getAdminApiSession,
  readWithAdminApiSession,
} from "@/lib/server/admin-api-auth";
import {
  AdminMerchandiseRequestError,
  getAdminMerchandiseSnapshot,
  saveAdminMerchandise,
  type AdminMerchandisePayload,
} from "@/lib/server/admin-merchandise";

import { invalidateMerchandise } from "./invalidate";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminMerchandiseSnapshot);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  return NextResponse.json({ items: result.data });
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request
    .json()
    .catch(() => null)) as AdminMerchandisePayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const saved = await saveAdminMerchandise(auth.accessToken, payload);
    invalidateMerchandise();

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    if (error instanceof AdminMerchandiseRequestError) {
      return NextResponse.json(
        { code: error.code, message: error.message, impact: error.impact },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Não foi possível criar o brinde." },
      { status: 500 },
    );
  }
}
