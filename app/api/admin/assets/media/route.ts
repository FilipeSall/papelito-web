import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { uploadAdminProductMedia } from "@/lib/server/admin-products";

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

export async function POST(request: Request) {
  const auth = await getAdminAccessToken();

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
