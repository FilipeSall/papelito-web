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

const PDV_PERFEITO = 2;

const AUTO_CLOSE_MS = 4500;

/** Aviso de nível na primeira subida. Some em 4,5 s; o do PDV Perfeito fica até fechar. */
export function LevelToast({ levelIndex, lead, onLead, onClose }: Readonly<LevelToastProps>) {
  const isPdv = levelIndex === PDV_PERFEITO;

  useEffect(() => {
    if (isPdv) return undefined;
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [isPdv, levelIndex, onClose]);

  return (
    <div role="status" className="expo-drop fixed inset-x-6 top-28 z-40 mx-auto flex max-w-[640px] items-center gap-4 rounded-lg border-[3px] border-[#231F20] bg-brand-yellow p-4 shadow-[6px_6px_0_#231F20]">
      <div className="min-w-0 flex-1">
        <p className="text-xl font-extrabold">{TITLES[levelIndex]}</p>
        <p className="text-base font-semibold">{TEXTS[levelIndex]}</p>
      </div>
      {isPdv ? (
        <button type="button" onClick={onLead} disabled={lead} className="h-11 rounded-md bg-[#231F20] px-4 font-extrabold text-brand-yellow">
          {lead ? "Anotado ✓" : "Quero saber"}
        </button>
      ) : null}
      <button type="button" aria-label="Fechar aviso" onClick={onClose} className="h-11 w-11 text-2xl font-bold">
        ×
      </button>
    </div>
  );
}
