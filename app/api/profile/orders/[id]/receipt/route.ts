import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { getWpRestBase } from "@/lib/server/env";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(status: number, payload: unknown) {
  if (payload && typeof payload === "object") {
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json({ message: "Nao foi possivel baixar o recibo." }, { status });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido invalido." }, { status: 400 });
  }

  const response = await fetch(`${getWpRestBase()}/papelito/v1/profile/me/orders/${id}/receipt`, {
    cache: "no-store",
    headers: {
      Accept: "application/pdf",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!response.ok) {
    return errorResponse(response.status, await response.json().catch(() => null));
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": response.headers.get("Content-Disposition") ?? `attachment; filename="recibo-pedido-${id}.pdf"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
