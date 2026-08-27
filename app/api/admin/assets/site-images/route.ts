import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  getAdminSiteImageAssetsSnapshot,
  saveAdminSiteImageAssets,
} from "@/lib/server/admin-home-assets";
import type { SiteImageAssets } from "@/types/home-assets";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminSiteImageAssetsSnapshot);

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

  const payload = (await request.json().catch(() => null)) as { images?: SiteImageAssets } | null;

  if (!payload?.images) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminSiteImageAssets(auth.accessToken, payload.images);
    revalidateTag("admin-site-image-assets", "max");
    revalidateTag("wp:site-image-assets", "max");
    revalidatePath("/produtos");
    revalidatePath("/sobre");
    revalidatePath("/revendedor");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar as imagens.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
