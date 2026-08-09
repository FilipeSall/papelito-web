import "server-only";

import { MAX_INSTALLMENTS } from "@/lib/installments";
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
    candidate.maxInstallments > MAX_INSTALLMENTS ||
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

export async function getAdminPaymentConfig(
  accessToken: string | undefined,
): Promise<{ config: PaymentConfig | null; issues: string[] }> {
  if (!accessToken) {
    return { config: null, issues: ["Sessão sem access token para consultar a configuração de parcelamento."] };
  }

  const result = await wpRest<unknown>("/papelito/v1/admin/payment-config", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["admin-payment-config"],
  });

  if (!result.ok) {
    return { config: null, issues: [result.error.message] };
  }

  const config = mapPaymentConfig(result.data);
  return config
    ? { config, issues: [] }
    : { config: null, issues: ["Resposta inválida ao consultar a configuração de parcelamento."] };
}

export async function saveAdminPaymentConfig(
  accessToken: string,
  config: PaymentConfig,
): Promise<PaymentConfig> {
  const result = await wpRest<unknown>("/papelito/v1/admin/payment-config", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: config,
    method: "PUT",
  });

  if (!result.ok) {
    const error = new Error(result.error.message) as Error & { status?: number };
    error.status = result.status;
    throw error;
  }

  const saved = mapPaymentConfig(result.data);
  if (!saved) {
    throw new Error("Resposta inválida ao salvar a configuração de parcelamento.");
  }

  return saved;
}
