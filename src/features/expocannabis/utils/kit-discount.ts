import { int } from "./parse-helpers";

/** Desconto do Kit Premium quando o WordPress ainda não manda o campo (deploy anterior à aba ExpoDay). */
export const DEFAULT_KIT_PCT_OFF = 15;

/**
 * Lê o desconto do kit do contexto ou da cotação. Campo ausente vale o padrão de 15%, para o tablet
 * não quebrar se o Next subir antes do WordPress; valor presente e fora de 0–100 é malformado (`null`).
 */
export function readKitPctOff(value: unknown): number | null {
  if (value === undefined) return DEFAULT_KIT_PCT_OFF;
  const pct = int(value);
  return pct !== null && pct >= 0 && pct <= 100 ? pct : null;
}

/** Rótulo do desconto do kit para a vitrine (`−20%`), ou vazio quando o kit está sem desconto. */
export function kitDiscountLabel(pctOff: number): string {
  return pctOff > 0 ? `−${pctOff}%` : "";
}
