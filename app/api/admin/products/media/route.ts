import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  isAdminProductMediaUploadError,
  uploadAdminProductMedia,
} from "@/lib/server/admin-products";

const PRODUCT_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const PRODUCT_IMAGE_EXTENSIONS = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp"]);

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

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (!PRODUCT_IMAGE_TYPES.has(file.type) && !PRODUCT_IMAGE_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { message: "Formato de imagem não permitido." },
      { status: 422 },
    );
  }

  try {
    const media = await uploadAdminProductMedia(auth.accessToken, file);
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (isAdminProductMediaUploadError(error)) {
      console.error("[admin-product-media] WordPress upload failed", {
        status: error.status,
        wordpressCode: error.wordpressCode,
      });
      return NextResponse.json(
        { message: "Não foi possível armazenar a imagem. Tente novamente." },
        { status: error.status },
      );
    }

    console.error("[admin-product-media] Upload proxy failed", { error });
    return NextResponse.json({ message: "Não foi possível enviar a imagem." }, { status: 500 });
  }
}
