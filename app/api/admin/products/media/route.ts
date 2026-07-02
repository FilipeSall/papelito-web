import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import { uploadAdminProductMedia } from "@/lib/server/admin-products";

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Arquivo de imagem obrigatorio." }, { status: 422 });
  }

  try {
    const media = await uploadAdminProductMedia(auth.accessToken, file);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel enviar a imagem.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
