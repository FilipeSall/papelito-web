import type { EventLevel } from "../types/context";

/** Texto e números do progresso do pedido até o próximo nível. */
export type LevelProgress = {
  current: EventLevel;
  next: EventLevel | null;
  missing: number;
  short: string;
  long: string;
};

function unitsWord(missing: number): string {
  return missing === 1 ? "Falta 1 unidade" : `Faltam ${missing} unidades`;
}

/** Nível atual, próximo nível e as frases curta (barra) e longa (cartão) de quanto falta. */
export function levelProgress(levels: readonly EventLevel[], units: number): LevelProgress {
  const next = levels.find((level) => level.minUnits > units) ?? null;
  const current = levels.reduce((found, level) => (units >= level.minUnits ? level : found), levels[0]);
  if (!next) {
    const top = levels[levels.length - 1];
    return { current, next, missing: 0, short: "Topo!", long: `Você chegou no topo: ${top.pctBp / 100}% off em tudo.` };
  }
  const missing = next.minUnits - units;
  const gift = current === levels[0] ? " + brinde" : "";
  return {
    current,
    next,
    missing,
    short: `${missing === 1 ? "Falta 1" : `Faltam ${missing}`} pra ${next.pctBp / 100}%`,
    long: `${unitsWord(missing)} pra ${next.name} (${next.pctBp / 100}% off${gift}).`,
  };
}

/** Quanto do trecho [from, to) o pedido já preencheu, em porcentagem. */
export function segmentFill(units: number, from: number, to: number): number {
  if (units <= from) return 0;
  if (units >= to) return 100;
  return ((units - from) / (to - from)) * 100;
}

/** Pares [de, até] dos trechos da barra: um por nível acima do primeiro. */
export function levelBounds(levels: readonly EventLevel[]): [number, number][] {
  return levels.slice(1).map((level, index): [number, number] => [levels[index].minUnits, level.minUnits]);
}
