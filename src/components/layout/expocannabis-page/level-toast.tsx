"use client";

import { useEffect } from "react";

import type { EventLevel, EventLevelKey } from "@/features/expocannabis/types/context";

type LevelToastProps = {
  levels: EventLevel[];
  levelIndex: number;
  lead: boolean;
  onLead: () => void;
  onClose: () => void;
};

/**
 * Nome da comemoração por chave do nível, não por posição na escada. A escada é publicada
 * no WordPress: tirar ou acrescentar um degrau muda a posição de todos os outros, e com
 * título fixo por posição a tela comemorava 8% enquanto a cotação cobrava 10%.
 */
const TITLE_BY_KEY: Partial<Record<EventLevelKey, string>> = {
  parceiro: "Você virou Parceiro!",
  pdv_perfeito: "Você é PDV Perfeito!",
  lenda: "Você é Lenda!",
};

/** A partir daqui o pedido leva brinde; é o mesmo corte do resumo e da confirmação. */
const GIFT_MIN_UNITS = 10;

const AUTO_CLOSE_MS = 4500;

/**
 * Onde mora o convite do programa PDV Perfeito: no nível de mesmo nome, e no nível do topo
 * quando a escada publicada não tem esse degrau. Sem essa volta, tirar a faixa do PDV do
 * WordPress apagaria da loja o único lugar que capta esse interesse, sem ninguém notar.
 */
export function leadLevelIndex(levels: readonly EventLevel[]): number {
  const own = levels.findIndex((level) => level.key === "pdv_perfeito");
  return own >= 0 ? own : levels.length - 1;
}

function toastTitle(level: EventLevel): string {
  return TITLE_BY_KEY[level.key] ?? `Você virou ${level.name}!`;
}

function toastText(level: EventLevel, isLead: boolean, isTop: boolean): string {
  const pct = `${level.pctBp / 100}% off em tudo`;
  if (isLead) return `${pct}. Quer conhecer o programa PDV Perfeito?`;
  if (isTop) return `${pct}, o maior desconto do ExpoDay.`;
  if (level.minUnits >= GIFT_MIN_UNITS) return `${pct} + bandeja chaveiro e merch liberados.`;
  return `${pct}.`;
}

/**
 * Carimbo de nível na primeira subida. Some em 4,5 s; o que leva a pergunta do PDV Perfeito
 * fica até fechar, porque tem botão dentro. Posiciona-se absoluto na coluna da loja, então o
 * pai precisa ser `relative`.
 */
export function LevelToast({ levels, levelIndex, lead, onLead, onClose }: Readonly<LevelToastProps>) {
  const level = levels[levelIndex];
  const isLead = levelIndex === leadLevelIndex(levels);

  useEffect(() => {
    if (isLead) return undefined;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isLead, levelIndex, onClose]);

  if (!level) return null;

  return (
    <div
      role="status"
      className="expo-carimbo sombra-dura absolute inset-x-6 top-3 z-20 flex -rotate-1 items-center gap-3.5 border-2 border-expo-ink bg-brand-yellow px-4 py-3 text-expo-ink"
    >
      <span className="ultra num flex-none bg-expo-noite px-2.5 py-2 text-[26px] leading-none text-brand-yellow">
        {`${level.pctBp / 100}%`}
      </span>
      <div className="min-w-0 flex-1">
        <p className="marker text-[20px] leading-none">Destravou!</p>
        <p className="mt-1 text-[17px] font-extrabold">{toastTitle(level)}</p>
        <p className="text-sm font-medium text-expo-mute">{toastText(level, isLead, levelIndex === levels.length - 1)}</p>
      </div>
      {isLead ? (
        <button
          type="button"
          onClick={onLead}
          disabled={lead}
          className="min-h-11 flex-none bg-expo-noite px-3.5 text-sm font-extrabold text-brand-yellow disabled:opacity-60"
        >
          {lead ? "Anotado ✓" : "Quero saber"}
        </button>
      ) : null}
      <button type="button" aria-label="Fechar aviso" onClick={onClose} className="size-11 flex-none text-[22px]">
        ×
      </button>
    </div>
  );
}
