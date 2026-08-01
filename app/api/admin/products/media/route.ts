import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  isAdminProductMediaUploadError,
  uploadAdminProductMedia,
} from "@/lib/server/admin-products";
import { fileExtension, validateImageUpload } from "@/lib/server/image-upload";
import { rejectionToFailure, wordpressFailure } from "@/lib/server/media-upload-errors";

function isUploadedFile(value: FormDataEntryValue | null | undefined): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    "type" in value
  );
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!isUploadedFile(file)) {
    return NextResponse.json({ message: "Arquivo de imagem obrigatório." }, { status: 422 });
  }

  const validation = await validateImageUpload(file);

  if (!validation.ok) {
    const failure = rejectionToFailure(validation.rejection);

    console.warn("[admin-product-media] Upload rejeitado na validação", {
      declaredType: file.type || null,
      detectedType:
        "detected" in validation.rejection ? validation.rejection.detected : null,
      extension: fileExtension(file.name) || null,
      reason: failure.logCode,
      size: file.size,
    });

    return NextResponse.json({ message: failure.message }, { status: failure.status });
  }

  try {
    const media = await uploadAdminProductMedia(auth.accessToken, file, {
      contentType: validation.mimeType,
      fileName: validation.fileName,
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (isAdminProductMediaUploadError(error)) {
      const failure = wordpressFailure(error.status, error.wordpressCode);

      console.error("[admin-product-media] WordPress recusou o upload", {
        detectedType: validation.mimeType,
        reason: failure.logCode,
        size: validation.size,
        wordpressCode: error.wordpressCode,
        wordpressMessage: error.wordpressMessage,
        wordpressStatus: error.status,
      });

      return NextResponse.json({ message: failure.message }, { status: failure.status });
    }

    console.error("[admin-product-media] Falha inesperada no proxy de upload", {
      detectedType: validation.mimeType,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { message: "Erro interno ao enviar a imagem. Tente novamente." },
      { status: 500 },
    );
  }
}
