import type { EventLevel } from "../types/context";
import { formatCents } from "./cart";

/** Texto e números do progresso do pedido até o próximo nível. */
export type LevelProgress = {
  current: EventLevel;
  next: EventLevel | null;
  /** Quanto falta em centavos para o próximo nível. */
  missing: number;
  short: string;
  long: string;
};

/**
 * Quanto falta, arredondado para cima no real. A barra é lida de relance e com o centavo
 * exato ela mentiria para baixo: faltando R$ 319,40 o lojista leria "faltam R$ 319" e
 * colocaria R$ 319, parando a um centavo da faixa.
 */
export function missingCents(cents: number): string {
  return `R$ ${Math.ceil(cents / 100).toLocaleString("pt-BR")}`;
}

/** Valor sem centavos para as marcas da régua, onde não cabe `R$ 1.000,00`. */
export function compactCents(cents: number): string {
  return `R$ ${Math.round(cents / 100).toLocaleString("pt-BR")}`;
}

/** Nível atual, próximo nível e as frases curta (barra) e longa (cartão) de quanto falta. */
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
    short: `Faltam ${missingCents(missing)} pra ${next.pctBp / 100}%`,
    long: `Faltam ${formatCents(missing)} pra ${next.name} (${next.pctBp / 100}% off${gift}).`,
  };
}

/** Quanto do trecho [from, to) o pedido já preencheu, em porcentagem. */
export function segmentFill(baseCents: number, from: number, to: number): number {
  if (baseCents <= from) return 0;
  if (baseCents >= to) return 100;
  return ((baseCents - from) / (to - from)) * 100;
}

/** Pares [de, até] dos trechos da barra: um por nível acima do primeiro. */
export function levelBounds(levels: readonly EventLevel[]): [number, number][] {
  return levels.slice(1).map((level, index): [number, number] => [levels[index].minCents, level.minCents]);
}
