import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  AdminKitRequestError,
  deleteAdminKit,
  saveAdminKit,
  type AdminKitPayload,
} from "@/lib/server/admin-kits";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ kitId: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { kitId } = await params;
  const parsedKitId = Number.parseInt(kitId, 10);
  if (!Number.isInteger(parsedKitId) || parsedKitId <= 0) {
    return NextResponse.json({ message: "Kit inválido." }, { status: 422 });
  }

  const payload = (await request
    .json()
    .catch(() => null)) as AdminKitPayload | null;
  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const kit = await saveAdminKit(auth.accessToken, payload, parsedKitId);
    revalidateTag("admin-kits", "max");
    revalidateTag("wp:kits", "max");
    revalidatePath("/kits");
    return NextResponse.json({ kit });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar o Kit.";
    const status = error instanceof AdminKitRequestError ? error.status : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ kitId: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { kitId } = await params;
  const parsedKitId = Number.parseInt(kitId, 10);
  if (!Number.isInteger(parsedKitId) || parsedKitId <= 0) {
    return NextResponse.json({ message: "Kit inválido." }, { status: 422 });
  }

  try {
    const deletion = await deleteAdminKit(auth.accessToken, parsedKitId);
    revalidateTag("admin-kits", "max");
    revalidateTag("wp:kits", "max");
    revalidatePath("/kits");
    return NextResponse.json(deletion);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível excluir o Kit.";
    const status = error instanceof AdminKitRequestError ? error.status : 500;
    return NextResponse.json({ message }, { status });
  }
}
