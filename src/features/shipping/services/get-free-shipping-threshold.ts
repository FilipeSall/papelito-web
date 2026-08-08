import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export type FreeShippingThreshold = {
  minimumOrderCents: number;
};

function mapFreeShippingThreshold(value: unknown): FreeShippingThreshold | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("minimumOrderCents" in value) ||
    typeof value.minimumOrderCents !== "number" ||
    !Number.isSafeInteger(value.minimumOrderCents) ||
    value.minimumOrderCents <= 0
  ) {
    return null;
  }

  return { minimumOrderCents: value.minimumOrderCents };
}

export async function getFreeShippingThreshold(): Promise<FreeShippingThreshold | null> {
  const result = await wpRest<unknown>("/papelito/v1/shipping/free-shipping-threshold", {
    revalidate: 60,
    tags: ["wp:shipping-free-shipping-threshold"],
  });

  if (!result.ok) {
    console.warn("[shipping] Falha ao consultar o mínimo de frete grátis.", result.error.message);
    return null;
  }

  return mapFreeShippingThreshold(result.data);
}

export async function getAdminFreeShippingThreshold(
  accessToken: string | undefined,
): Promise<{ threshold: FreeShippingThreshold | null; issues: string[] }> {
  if (!accessToken) {
    return { threshold: null, issues: ["Sessão sem access token para consultar o mínimo de frete grátis."] };
  }

  const result = await wpRest<unknown>("/papelito/v1/admin/shipping/free-shipping-threshold", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["admin-free-shipping-threshold"],
  });

  if (!result.ok) {
    return { threshold: null, issues: [result.error.message] };
  }

  const threshold = mapFreeShippingThreshold(result.data);
  return threshold
    ? { threshold, issues: [] }
    : { threshold: null, issues: ["Resposta inválida ao consultar o mínimo de frete grátis."] };
}

export async function saveAdminFreeShippingThreshold(accessToken: string, minimumOrderCents: number) {
  const result = await wpRest<unknown>("/papelito/v1/admin/shipping/free-shipping-threshold", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { minimumOrderCents },
    method: "PUT",
  });

  if (!result.ok) {
    const error = new Error(result.error.message) as Error & { status?: number };
    error.status = result.status;
    throw error;
  }

  const threshold = mapFreeShippingThreshold(result.data);
  if (!threshold) {
    throw new Error("Resposta inválida ao salvar o mínimo de frete grátis.");
  }

  return threshold;
}
