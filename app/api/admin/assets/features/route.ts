import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminHomeFeaturesSnapshot,
  saveAdminHomeFeatures,
} from "@/lib/server/admin-home-assets";
import type { HomeFeatureItem } from "@/types/home-assets";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminHomeFeaturesSnapshot);

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

  const payload = (await request.json().catch(() => null)) as { items?: HomeFeatureItem[] } | null;

  if (!payload || !Array.isArray(payload.items)) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminHomeFeatures(auth.accessToken, payload.items);
    revalidateTag("admin-home-features", { expire: 0 });
    revalidateTag("wp:home-features", { expire: 0 });
    revalidatePath("/admin/assets");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar os benefícios.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
