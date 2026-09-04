import { describe, expect, it } from "vitest";

import {
  COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS,
  COLLECTIONS_CONFIG_MAX_LIMIT,
  DEFAULT_COLLECTIONS_CONFIG,
} from "../types/collections-config";

import { mapCollectionsConfig } from "./get-collections-config";

describe("mapCollectionsConfig", () => {
  it("cai no padrão sem resposta utilizável", () => {
    expect(mapCollectionsConfig(null)).toEqual(DEFAULT_COLLECTIONS_CONFIG);
    expect(mapCollectionsConfig("nada")).toEqual(DEFAULT_COLLECTIONS_CONFIG);
    expect(mapCollectionsConfig({})).toEqual(DEFAULT_COLLECTIONS_CONFIG);
  });

  it("preserva um prazo acima do teto de quantidade", () => {
    const config = mapCollectionsConfig({
      newArrivals: { expirationDays: 90, limit: 10 },
      promotions: { limit: 0 },
    });

    expect(config.newArrivals.expirationDays).toBe(90);
  });

  it("apara quantidade e prazo pelos tetos que são de cada um", () => {
    const config = mapCollectionsConfig({
      newArrivals: { expirationDays: 900, limit: 999 },
      promotions: { limit: 999 },
    });

    expect(config.newArrivals.limit).toBe(COLLECTIONS_CONFIG_MAX_LIMIT);
    expect(config.newArrivals.expirationDays).toBe(COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS);
    expect(config.promotions.limit).toBe(COLLECTIONS_CONFIG_MAX_LIMIT);
  });

  it("aceita o prazo no limite exato do backend", () => {
    const config = mapCollectionsConfig({
      newArrivals: { expirationDays: COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS, limit: 10 },
      promotions: { limit: 0 },
    });

    expect(config.newArrivals.expirationDays).toBe(COLLECTIONS_CONFIG_MAX_EXPIRATION_DAYS);
  });

  it("recusa valores inutilizáveis campo por campo", () => {
    const config = mapCollectionsConfig({
      newArrivals: { expirationDays: -5, limit: 0 },
      promotions: { limit: "doze" },
    });

    expect(config.newArrivals.limit).toBe(DEFAULT_COLLECTIONS_CONFIG.newArrivals.limit);
    expect(config.newArrivals.expirationDays).toBe(0);
    expect(config.promotions.limit).toBe(0);
  });
});
