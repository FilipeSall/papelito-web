import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  createAdminProductTag,
  type AdminProductTagPayload,
} from "@/lib/server/admin-products";

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as AdminProductTagPayload | null;

  if (!payload?.name?.trim()) {
    return NextResponse.json({ message: "Nome da tag e obrigatorio." }, { status: 422 });
  }

  try {
    const tag = await createAdminProductTag(auth.accessToken, payload);
    revalidateTag("admin-product-taxonomies", "max");
    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar a tag.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
