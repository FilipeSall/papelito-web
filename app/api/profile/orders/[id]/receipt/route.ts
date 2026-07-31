import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { getWpRestBase } from "@/lib/server/env";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(status: number, payload: unknown) {
  if (payload && typeof payload === "object") {
    return NextResponse.json(payload, { status });
  }

  return NextResponse.json({ message: "Não foi possível baixar o recibo." }, { status });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getUserApiSession();

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  }

  const base = getWpRestBase().replace(/\/$/, "");
  let response: Response;

  try {
    response = await fetch(`${base}/papelito/v1/profile/me/orders/${id}/receipt`, {
      cache: "no-store",
      headers: {
        Accept: "application/pdf",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch {
    return NextResponse.json({ message: "Não foi possível baixar o recibo." }, { status: 502 });
  }

  if (!response.ok) {
    return errorResponse(response.status, await response.json().catch(() => null));
  }

  return new NextResponse(response.body, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition":
        response.headers.get("content-disposition") ?? `attachment; filename="recibo-pedido-${id}.pdf"`,
      "Content-Type": response.headers.get("content-type") ?? "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
    status: 200,
  });
}
