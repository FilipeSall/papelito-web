import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  getAdminPartnerBannerSnapshot,
  saveAdminPartnerBanner,
} from "@/lib/server/admin-home-assets";
import type { PartnerBannerConfig } from "@/types/home-assets";

export async function GET() {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const snapshot = await getAdminPartnerBannerSnapshot(auth.accessToken);
  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as
    | { banner?: PartnerBannerConfig }
    | null;

  if (!payload?.banner) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminPartnerBanner(auth.accessToken, payload.banner);
    revalidateTag("admin-home-partner-banner", "max");
    revalidateTag("wp:home-partner-banner", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel salvar o partner banner.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
