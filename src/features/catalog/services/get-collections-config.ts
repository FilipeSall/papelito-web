import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import {
  COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS,
  COLLECTIONS_CONFIG_MAX_LIMIT,
  DEFAULT_COLLECTIONS_CONFIG,
  type CollectionsConfig,
  type NewArrivalsConfig,
  type PromotionsConfig,
} from "../types/collections-config";

export type {
  CollectionsConfig,
  NewArrivalsConfig,
  PromotionsConfig,
} from "../types/collections-config";

/**
 * Lê um inteiro de configuração aparando pelo teto do próprio campo.
 *
 * O teto entra como argumento porque quantidade e prazo têm limites diferentes: apará-los pelo
 * mesmo número transformava 90 dias em 60.
 */
function readBoundedInteger(source: unknown, key: string, maximum: number, fallback: number): number {
  if (typeof source !== "object" || source === null || !(key in source)) {
    return fallback;
  }

  const value = (source as Record<string, unknown>)[key];

  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return fallback;
  }

  return Math.min(value, maximum);
}

export function mapCollectionsConfig(value: unknown): CollectionsConfig {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_COLLECTIONS_CONFIG;
  }

  const newArrivals = "newArrivals" in value ? value.newArrivals : null;
  const promotions = "promotions" in value ? value.promotions : null;

  const limit = readBoundedInteger(
    newArrivals,
    "limit",
    COLLECTIONS_CONFIG_MAX_LIMIT,
    DEFAULT_COLLECTIONS_CONFIG.newArrivals.limit,
  );

  return {
    newArrivals: {
      limit: limit > 0 ? limit : DEFAULT_COLLECTIONS_CONFIG.newArrivals.limit,
      expirationDays: readBoundedInteger(
        newArrivals,
        "expirationDays",
        COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS,
        0,
      ),
    },
    promotions: {
      limit: readBoundedInteger(
        promotions,
        "limit",
        COLLECTIONS_CONFIG_MAX_LIMIT,
        DEFAULT_COLLECTIONS_CONFIG.promotions.limit,
      ),
    },
  };
}

export async function getCollectionsConfig(): Promise<CollectionsConfig> {
  const result = await wpRest<unknown>("/papelito/v1/collections-config", {
    revalidate: 60,
    tags: ["wp:collections-config"],
  });

  if (!result.ok) {
    console.warn("[collections] Falha ao consultar a configuração das coleções.", result.error.message);
    return DEFAULT_COLLECTIONS_CONFIG;
  }

  return mapCollectionsConfig(result.data);
}

export async function getAdminCollectionsConfig(
  accessToken: string | undefined,
): Promise<{ config: CollectionsConfig; issues: string[] }> {
  if (!accessToken) {
    return {
      config: DEFAULT_COLLECTIONS_CONFIG,
      issues: ["Sessão sem access token para consultar a configuração das coleções."],
    };
  }

  const result = await wpRest<unknown>("/papelito/v1/admin/collections-config", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["admin-collections-config"],
  });

  if (!result.ok) {
    return { config: DEFAULT_COLLECTIONS_CONFIG, issues: [result.error.message] };
  }

  return { config: mapCollectionsConfig(result.data), issues: [] };
}

export type CollectionsConfigInput = {
  newArrivals?: Partial<NewArrivalsConfig>;
  promotions?: Partial<PromotionsConfig>;
};

export async function saveAdminCollectionsConfig(
  accessToken: string,
  input: CollectionsConfigInput,
): Promise<CollectionsConfig> {
  const result = await wpRest<unknown>("/papelito/v1/admin/collections-config", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: input,
    method: "PUT",
  });

  if (!result.ok) {
    const error = new Error(result.error.message) as Error & { status?: number };
    error.status = result.status;
    throw error;
  }

  return mapCollectionsConfig(result.data);
}
