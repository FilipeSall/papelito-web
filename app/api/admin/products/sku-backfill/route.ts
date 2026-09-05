import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  backfillAdminProductSkus,
  type AdminProductSkuBackfillSummary,
} from "@/lib/server/admin-products";

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as {
    batch?: unknown;
    dryRun?: unknown;
  } | null;
  const batch = typeof payload?.batch === "number" && Number.isInteger(payload.batch)
    ? Math.max(1, Math.min(500, payload.batch))
    : 100;
  const dryRun = payload?.dryRun === true;

  try {
    const summary = (await backfillAdminProductSkus(auth.accessToken, {
      batch,
      dryRun,
    })) as AdminProductSkuBackfillSummary;
    revalidateTag("admin-products", "max");
    revalidateTag("wp:products", "max");
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar os SKUs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
