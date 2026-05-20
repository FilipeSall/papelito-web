import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  getAdminSiteImageAssetsSnapshot,
  saveAdminSiteImageAssets,
} from "@/lib/server/admin-home-assets";
import type { SiteImageAssets } from "@/types/home-assets";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

async function getAdminAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Nao autenticado.", status: 401 as const };
  }

  if (normalizeRole(session.role) !== "administrator") {
    return { error: "Acesso administrativo necessario.", status: 403 as const };
  }

  return { accessToken: session.accessToken };
}

export async function GET() {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const snapshot = await getAdminSiteImageAssetsSnapshot(auth.accessToken);
  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { images?: SiteImageAssets } | null;

  if (!payload?.images) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
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
    const message = error instanceof Error ? error.message : "Nao foi possivel salvar as imagens.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
