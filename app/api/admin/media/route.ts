import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { deleteAdminMedia } from "@/lib/server/admin-products";

function mediaIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.filter((id): id is number => Number.isInteger(id) && id > 0)),
  ).slice(0, 50);
}

export async function DELETE(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as {
    ids?: unknown;
  } | null;
  const ids = mediaIds(body?.ids);

  if (ids.length === 0) {
    return NextResponse.json(
      { message: "Informe ao menos uma mídia válida." },
      { status: 422 },
    );
  }

  try {
    await deleteAdminMedia(auth.accessToken, ids);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível remover as mídias não utilizadas." },
      { status: 502 },
    );
  }
}
