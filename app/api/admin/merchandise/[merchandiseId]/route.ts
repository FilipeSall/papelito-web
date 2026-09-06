import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  AdminMerchandiseRequestError,
  deleteAdminMerchandise,
  saveAdminMerchandise,
  type AdminMerchandisePayload,
} from "@/lib/server/admin-merchandise";

import { invalidateMerchandise } from "../invalidate";

type RouteContext = { params: Promise<{ merchandiseId: string }> };

function parseId(value: string) {
  const merchandiseId = Number.parseInt(value, 10);

  return Number.isInteger(merchandiseId) && merchandiseId > 0 ? merchandiseId : null;
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof AdminMerchandiseRequestError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        impact: error.impact,
        kits: error.kits,
      },
      { status: error.status },
    );
  }

  return NextResponse.json({ message: fallback }, { status: 500 });
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const merchandiseId = parseId((await context.params).merchandiseId);

  if (!merchandiseId) {
    return NextResponse.json({ message: "Brinde inválido." }, { status: 400 });
  }

  const payload = (await request
    .json()
    .catch(() => null)) as AdminMerchandisePayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const saved = await saveAdminMerchandise(auth.accessToken, payload, merchandiseId);
    invalidateMerchandise({ affectsKits: true });

    return NextResponse.json(saved);
  } catch (error) {
    return errorResponse(error, "Não foi possível salvar o brinde.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const merchandiseId = parseId((await context.params).merchandiseId);

  if (!merchandiseId) {
    return NextResponse.json({ message: "Brinde inválido." }, { status: 400 });
  }

  try {
    const deletion = await deleteAdminMerchandise(auth.accessToken, merchandiseId);
    invalidateMerchandise();

    return NextResponse.json(deletion);
  } catch (error) {
    return errorResponse(error, "Não foi possível excluir o brinde.");
  }
}
