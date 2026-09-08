import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminCollectionsNavSnapshot,
  saveAdminCollectionsNav,
} from "@/lib/server/admin-home-assets";
import type { CollectionNavItem } from "@/types/home-assets";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminCollectionsNavSnapshot);

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

  const payload = (await request.json().catch(() => null)) as {
    items?: CollectionNavItem[];
  } | null;

  if (!payload || !Array.isArray(payload.items)) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminCollectionsNav(auth.accessToken, payload.items);
    revalidateTag("admin-home-collections-nav", { expire: 0 });
    revalidateTag("wp:home-collections-nav", { expire: 0 });
    revalidatePath("/admin/assets");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o corredor de coleções.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
