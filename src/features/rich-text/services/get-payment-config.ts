import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export type PaymentConfig = {
  maxInstallments: number;
  installmentMinimumCents: number;
};

function mapPaymentConfig(value: unknown): PaymentConfig | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.maxInstallments !== "number" ||
    !Number.isSafeInteger(candidate.maxInstallments) ||
    candidate.maxInstallments <= 0 ||
    typeof candidate.installmentMinimumCents !== "number" ||
    !Number.isSafeInteger(candidate.installmentMinimumCents) ||
    candidate.installmentMinimumCents <= 0
  ) {
    return null;
  }

  return {
    maxInstallments: candidate.maxInstallments,
    installmentMinimumCents: candidate.installmentMinimumCents,
  };
}

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const result = await wpRest<unknown>(
    "/papelito/v1/home/payment-config",
    process.env.NODE_ENV === "development"
      ? {}
      : { revalidate: 60, tags: ["wp:home-payment-config"] },
  );

  if (!result.ok) {
    console.warn("[rich-text] Falha ao consultar a configuração de parcelamento.", result.error.message);
    return null;
  }

  return mapPaymentConfig(result.data);
}
