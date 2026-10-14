import type { VendorCorreiosPreference } from "../types/vendor-correios";

/**
 * Lê `correios_enabled`/`correios_locked` de uma resposta do WordPress.
 *
 * Devolve `null` quando os campos não vêm como booleanos, para quem chama não
 * pintar um estado que o servidor não afirmou.
 */
export function readCorreiosPreference(payload: unknown): VendorCorreiosPreference | null {
  if (typeof payload !== "object" || payload === null) return null;

  const { correios_enabled: enabled, correios_locked: locked } = payload as Record<string, unknown>;

  if (typeof enabled !== "boolean" || typeof locked !== "boolean") return null;

  return { enabled, locked };
}
