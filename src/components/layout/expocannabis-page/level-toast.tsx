"use client";

import { useEffect } from "react";

type LevelToastProps = {
  levelIndex: number;
  lead: boolean;
  onLead: () => void;
  onClose: () => void;
};

const TITLES = ["", "Você virou Parceiro!", "Você é PDV Perfeito!", "Você é Lenda!"];

const TEXTS = [
  "",
  "5% off em tudo + bandeja chaveiro e merch liberados.",
  "8% off em tudo. Quer conhecer o programa PDV Perfeito?",
  "12% off em tudo, o maior desconto do ExpoDay.",
];

const BADGES = ["", "5%", "8%", "12%"];

const PDV_PERFEITO = 2;

const AUTO_CLOSE_MS = 4500;

/**
 * Carimbo de nível na primeira subida. Some em 4,5 s; o do PDV Perfeito fica até fechar,
 * porque é o único com uma pergunta dentro. Posiciona-se absoluto na coluna da loja,
 * então o pai precisa ser `relative`.
 */
export function LevelToast({ levelIndex, lead, onLead, onClose }: Readonly<LevelToastProps>) {
  const isPdv = levelIndex === PDV_PERFEITO;

  useEffect(() => {
    if (isPdv) return undefined;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isPdv, levelIndex, onClose]);

  return (
    <div
      role="status"
      className="expo-carimbo sombra-dura absolute inset-x-6 top-3 z-20 flex -rotate-1 items-center gap-3.5 border-2 border-expo-ink bg-brand-yellow px-4 py-3 text-expo-ink"
    >
      <span className="ultra num flex-none bg-expo-noite px-2.5 py-2 text-[26px] leading-none text-brand-yellow">{BADGES[levelIndex]}</span>
      <div className="min-w-0 flex-1">
        <p className="marker text-[20px] leading-none">Destravou!</p>
        <p className="mt-1 text-[17px] font-extrabold">{TITLES[levelIndex]}</p>
        <p className="text-sm font-medium text-expo-mute">{TEXTS[levelIndex]}</p>
      </div>
      {isPdv ? (
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
