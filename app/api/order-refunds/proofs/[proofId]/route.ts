import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { getWpRestBase } from "@/lib/server/env";

/**
 * Comprovante do estorno manual. Sem URL pública: o WordPress decide se quem
 * pede é o vendor, o comprador (só depois do registro) ou a Papelito.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ proofId: string }> }) {
  const session = await getUserApiSession();
  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const { proofId } = await params;
  if (!/^\d+$/.test(proofId)) {
    return NextResponse.json({ message: "Comprovante inválido." }, { status: 422 });
  }

  const upstream = await fetch(
    `${getWpRestBase().replace(/\/$/, "")}/papelito/v1/order-refunds/proofs/${proofId}/download`,
    { cache: "no-store", headers: { Authorization: `Bearer ${session.accessToken}` } },
  ).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    return NextResponse.json(
      { message: "Comprovante indisponível." },
      { status: upstream?.status && upstream.status >= 400 ? upstream.status : 502 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? "attachment",
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
    },
  });
}
