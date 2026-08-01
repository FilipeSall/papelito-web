import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  isAdminProductMediaUploadError,
  uploadAdminProductMedia,
} from "@/lib/server/admin-products";
import { wordpressFailure } from "@/lib/server/media-upload-errors";

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Arquivo de imagem obrigatório." }, { status: 422 });
  }

  try {
    const media = await uploadAdminProductMedia(auth.accessToken, file);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (isAdminProductMediaUploadError(error)) {
      const failure = wordpressFailure(error.status, error.wordpressCode);

      console.error("[admin-asset-media] WordPress recusou o upload", {
        reason: failure.logCode,
        wordpressCode: error.wordpressCode,
        wordpressMessage: error.wordpressMessage,
        wordpressStatus: error.status,
      });

      return NextResponse.json({ message: failure.message }, { status: failure.status });
    }

    console.error("[admin-asset-media] Falha inesperada no proxy de upload", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { message: "Erro interno ao enviar a imagem. Tente novamente." },
      { status: 500 },
    );
  }
}
