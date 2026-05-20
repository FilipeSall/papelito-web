import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  getAdminPartnerBannerSnapshot,
  saveAdminPartnerBanner,
} from "@/lib/server/admin-home-assets";
import type { PartnerBannerConfig } from "@/types/home-assets";

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

  const snapshot = await getAdminPartnerBannerSnapshot(auth.accessToken);
  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  const auth = await getAdminAccessToken();

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
