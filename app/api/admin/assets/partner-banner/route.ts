import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  getAdminPartnerBannerSnapshot,
  saveAdminPartnerBanner,
} from "@/lib/server/admin-home-assets";
import type { PartnerBannerConfig } from "@/types/home-assets";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminPartnerBannerSnapshot);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
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
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminPartnerBanner(auth.accessToken, payload.banner);
    revalidateTag("admin-home-partner-banner", "max");
    revalidateTag("wp:home-partner-banner", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o partner banner.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
