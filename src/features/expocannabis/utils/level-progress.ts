import type { EventLevel } from "../types/context";
import { formatCents } from "./cart";

/** Texto e números do progresso do pedido até o próximo nível. */
export type LevelProgress = {
  current: EventLevel;
  next: EventLevel | null;
  missing: number;
  short: string;
  long: string;
};

/** Nível atual, próximo nível e as frases curta (barra) e longa (cartão) de quanto falta, em reais. */
export function levelProgress(levels: readonly EventLevel[], baseCents: number): LevelProgress {
  const next = levels.find((level) => level.minCents > baseCents) ?? null;
  const current = levels.reduce((found, level) => (baseCents >= level.minCents ? level : found), levels[0]);
  if (!next) {
    const top = levels[levels.length - 1];
    return { current, next, missing: 0, short: "Topo!", long: `Você chegou no topo: ${top.pctBp / 100}% off em tudo.` };
  }
  const missing = next.minCents - baseCents;
  const gift = current === levels[0] ? " + brinde" : "";
  return {
    current,
    next,
    missing,
    short: `Faltam ${formatCents(missing)} pra ${next.pctBp / 100}%`,
    long: `Faltam ${formatCents(missing)} pra ${next.name} (${next.pctBp / 100}% off${gift}).`,
  };
}

/** Quanto do trecho [from, to) o pedido já preencheu, em porcentagem. */
export function segmentFill(value: number, from: number, to: number): number {
  if (value <= from) return 0;
  if (value >= to) return 100;
  return ((value - from) / (to - from)) * 100;
}

/** Pares [de, até] dos trechos da barra, em centavos: um por nível acima do primeiro. */
export function levelBounds(levels: readonly EventLevel[]): [number, number][] {
  return levels.slice(1).map((level, index): [number, number] => [levels[index].minCents, level.minCents]);
}
