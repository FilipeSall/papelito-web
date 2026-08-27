import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  deleteAdminFlashSale,
  getAdminFlashSaleSnapshot,
  saveAdminFlashSale,
  AdminFlashSaleRequestError,
  type AdminFlashSalePayload,
} from "@/lib/server/admin-flash-sale";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminFlashSaleSnapshot);

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

  const payload = (await request.json().catch(() => null)) as AdminFlashSalePayload | null;

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await saveAdminFlashSale(auth.accessToken, payload);
    revalidateTag("admin-flash-sale", "max");
    revalidateTag("wp:home-flash-sale", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar a campanha.";
    const status = error instanceof AdminFlashSaleRequestError ? error.status : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE() {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  try {
    const snapshot = await deleteAdminFlashSale(auth.accessToken);
    revalidateTag("admin-flash-sale", "max");
    revalidateTag("wp:home-flash-sale", "max");
    revalidatePath("/");
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível remover a campanha.";
    const status = error instanceof AdminFlashSaleRequestError ? error.status : 500;
    return NextResponse.json({ message }, { status });
  }
}
