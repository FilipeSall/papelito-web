import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminKitsSnapshot,
  saveAdminKit,
  type AdminKitPayload,
  AdminKitRequestError,
} from "@/lib/server/admin-kits";

export async function GET() {
  const auth = await getAdminApiSession();
  if ("error" in auth)
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  return NextResponse.json({
    items: await getAdminKitsSnapshot(auth.accessToken),
  });
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth)
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  const payload = (await request
    .json()
    .catch(() => null)) as AdminKitPayload | null;
  if (!payload)
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  try {
    const kit = await saveAdminKit(auth.accessToken, payload);
    revalidateTag("admin-kits", "max");
    revalidateTag("wp:kits", "max");
    revalidatePath("/kits");
    return NextResponse.json({ kit }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o Kit.",
      },
      { status: error instanceof AdminKitRequestError ? error.status : 500 },
    );
  }
}
