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
 * Aviso de nível na primeira subida. Some em 4,5 s; o do PDV Perfeito fica até fechar.
 * Posiciona-se de forma absoluta na coluna da loja, então o pai precisa ser `relative`.
 */
export function LevelToast({ levelIndex, lead, onLead, onClose }: Readonly<LevelToastProps>) {
  const isPdv = levelIndex === PDV_PERFEITO;

  useEffect(() => {
    if (isPdv) return undefined;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isPdv, levelIndex, onClose]);

  return (
    <div role="status" className="expo-drop absolute inset-x-6 top-3 z-20 flex items-center gap-3.5 rounded-[10px] bg-[#231F20] px-4.5 py-4 text-white">
      <span className="flex-none rounded-md bg-brand-yellow px-2.5 py-2 font-[family-name:var(--font-expo-display)] text-[22px] uppercase leading-none text-[#231F20]">
        {BADGES[levelIndex]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-extrabold">{TITLES[levelIndex]}</p>
        <p className="mt-0.5 text-sm font-medium text-[#e4e4e7]">{TEXTS[levelIndex]}</p>
      </div>
      {isPdv ? (
        <button
          type="button"
          onClick={onLead}
          disabled={lead}
          className="min-h-11 flex-none rounded-md bg-brand-yellow px-3.5 text-sm font-extrabold text-[#231F20] focus-visible:outline-brand-yellow"
        >
          {lead ? "Anotado ✓" : "Quero saber"}
        </button>
      ) : null}
      <button type="button" aria-label="Fechar aviso" onClick={onClose} className="size-11 flex-none text-[22px] text-white focus-visible:outline-brand-yellow">
        ×
      </button>
    </div>
  );
}
