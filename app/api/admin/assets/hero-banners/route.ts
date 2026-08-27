import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import { getAdminHeroBannersSnapshot, saveAdminHeroBanners } from "@/lib/server/admin-home-assets";
import type { HeroBanner } from "@/types/home-assets";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminHeroBannersSnapshot);

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

  const payload = (await request.json().catch(() => null)) as { banners?: HeroBanner[] } | null;

  if (!payload || !Array.isArray(payload.banners)) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminHeroBanners(auth.accessToken, payload.banners);
    revalidateTag("admin-home-hero-banners", "max");
    revalidateTag("wp:home-hero-banners", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar os hero banners.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
