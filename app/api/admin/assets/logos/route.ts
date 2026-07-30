import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  getAdminSiteLogosSnapshot,
  restoreAdminSiteLogo,
  saveAdminSiteLogos,
} from "@/lib/server/admin-home-assets";
import { SITE_LOGO_KEYS } from "@/lib/site-logos";
import type { SiteLogoKey, SiteLogos } from "@/types/home-assets";

function isSiteLogoKey(value: unknown): value is SiteLogoKey {
  return typeof value === "string" && (SITE_LOGO_KEYS as string[]).includes(value);
}

function revalidateLogos() {
  revalidateTag("admin-site-logos", "max");
  revalidateTag("wp:site-logos", "max");
  revalidatePath("/", "layout");
}

function errorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const status =
    typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
      ? error.status
      : 500;
  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const snapshot = await getAdminSiteLogosSnapshot(auth.accessToken);
  return NextResponse.json(snapshot);
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as { logos?: SiteLogos } | null;

  if (!payload?.logos) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminSiteLogos(auth.accessToken, payload.logos);
    revalidateLogos();
    return NextResponse.json(snapshot);
  } catch (error) {
    return errorResponse(error, "Não foi possível salvar as logos.");
  }
}

export async function DELETE(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const key = new URL(request.url).searchParams.get("key");

  if (!isSiteLogoKey(key)) {
    return NextResponse.json({ message: "Logo informada não existe." }, { status: 400 });
  }

  try {
    const snapshot = await restoreAdminSiteLogo(auth.accessToken, key);
    revalidateLogos();
    return NextResponse.json(snapshot);
  } catch (error) {
    return errorResponse(error, "Não foi possível restaurar a logo padrão.");
  }
}
