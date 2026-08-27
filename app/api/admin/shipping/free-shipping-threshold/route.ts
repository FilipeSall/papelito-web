import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  getAdminFreeShippingThreshold,
  saveAdminFreeShippingThreshold,
} from "@/features/shipping/services/get-free-shipping-threshold";

function getMinimumOrderCents(payload: unknown): number | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("minimumOrderCents" in payload) ||
    typeof payload.minimumOrderCents !== "number" ||
    !Number.isSafeInteger(payload.minimumOrderCents) ||
    payload.minimumOrderCents <= 0
  ) {
    return null;
  }

  return payload.minimumOrderCents;
}

export async function GET() {
  try {
    const session = await readWithAdminApiSession(getAdminFreeShippingThreshold);
    if ("error" in session) {
      return NextResponse.json({ message: session.error }, { status: session.status });
    }
    const result = session.data;
    if (!result.threshold) {
      return NextResponse.json({ message: result.issues[0] ?? "Não foi possível consultar o mínimo." }, { status: 502 });
    }
    return NextResponse.json(result.threshold);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível consultar o mínimo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const minimumOrderCents = getMinimumOrderCents(await request.json().catch(() => null));
  if (minimumOrderCents === null) {
    return NextResponse.json({ message: "Informe um valor mínimo positivo em centavos." }, { status: 400 });
  }

  try {
    const threshold = await saveAdminFreeShippingThreshold(auth.accessToken, minimumOrderCents);
    revalidateTag("admin-free-shipping-threshold", { expire: 0 });
    revalidateTag("wp:shipping-free-shipping-threshold", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/carrinho");
    revalidatePath("/produtos/[id]", "page");
    return NextResponse.json(threshold);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar o mínimo.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
