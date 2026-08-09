import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  getAdminPaymentConfig,
  saveAdminPaymentConfig,
  type PaymentConfig,
} from "@/features/rich-text/services/get-payment-config";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";

function getPaymentConfig(payload: unknown): PaymentConfig | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("maxInstallments" in payload) ||
    !("installmentMinimumCents" in payload) ||
    typeof payload.maxInstallments !== "number" ||
    !Number.isSafeInteger(payload.maxInstallments) ||
    payload.maxInstallments <= 0 ||
    typeof payload.installmentMinimumCents !== "number" ||
    !Number.isSafeInteger(payload.installmentMinimumCents) ||
    payload.installmentMinimumCents <= 0
  ) {
    return null;
  }

  return {
    maxInstallments: payload.maxInstallments,
    installmentMinimumCents: payload.installmentMinimumCents,
  };
}

export async function GET() {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const result = await getAdminPaymentConfig(auth.accessToken);
  return result.config
    ? NextResponse.json(result.config)
    : NextResponse.json({ message: result.issues[0] ?? "Não foi possível consultar a configuração." }, { status: 502 });
}

export async function PUT(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const config = getPaymentConfig(await request.json().catch(() => null));
  if (!config) {
    return NextResponse.json(
      { message: "Informe valores positivos para máximo de parcelas e mínimo por parcela." },
      { status: 400 },
    );
  }

  try {
    const saved = await saveAdminPaymentConfig(auth.accessToken, config);
    revalidateTag("admin-payment-config", { expire: 0 });
    revalidateTag("wp:home-payment-config", { expire: 0 });
    revalidatePath("/");
    revalidatePath("/carrinho");
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível salvar a configuração.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json({ message }, { status });
  }
}
