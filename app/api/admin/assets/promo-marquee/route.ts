import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminPromoMarqueeSnapshot,
  saveAdminPromoMarquee,
} from "@/lib/server/admin-home-assets";
import type { PromoMarqueeItem } from "@/types/home-assets";

export async function GET() {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const snapshot = await getAdminPromoMarqueeSnapshot(auth.accessToken);
  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { messages?: PromoMarqueeItem[] } | null;

  if (!payload || !Array.isArray(payload.messages)) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminPromoMarquee(auth.accessToken, payload.messages);
    revalidateTag("admin-home-promo-marquee", { expire: 0 });
    revalidateTag("wp:home-promo-marquee", { expire: 0 });
    revalidatePath("/admin/assets");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar a faixa de avisos.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
