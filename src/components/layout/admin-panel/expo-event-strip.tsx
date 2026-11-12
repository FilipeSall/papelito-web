"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { EXPOCANNABIS_PATH } from "@/features/expocannabis/constants";
import { EXPO_SCOPE_CLASS } from "@/features/expocannabis/fonts";
import { expoEventDays } from "@/features/expocannabis/utils/event-phase";

import { useExpoEventPhase } from "./use-expo-event-phase";

function WindowNote({ open }: Readonly<{ open: boolean }>) {
  const days = expoEventDays();

  if (!open) {
    return <p className="text-[15px] font-semibold">{`Venda no estande de ${days.start} a ${days.end}`}</p>;
  }

  return (
    <p className="flex items-center gap-2 text-[15px] font-bold">
      <span aria-hidden className="expo-blink h-2.5 w-2.5 flex-none bg-[#231F20]" />
      {`Venda aberta no estande até ${days.end}`}
    </p>
  );
}

/**
 * Faixa do ExpoCannabis no topo do painel admin, na linguagem do tablet do estande (amarelo, Ultra,
 * etiqueta "ExpoDay" e a foto do kit). Leva ao `/expocannabis` em aba nova e some sozinha quando
 * a janela do evento termina.
 */
export function ExpoEventStrip() {
  const phase = useExpoEventPhase();

  if (phase === "hidden") return null;

  return (
    <aside
      aria-label="Estande ExpoCannabis"
      className={`${EXPO_SCOPE_CLASS} relative z-10 flex flex-none items-center overflow-hidden border-b-2 border-[#231F20] bg-brand-yellow`}
    >
      <div className="relative z-1 flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6 lg:px-8">
        <p className="-rotate-3 bg-[#231F20] px-3 pb-0.5 pt-1 font-[family-name:var(--font-expo-marker)] text-base text-brand-yellow">
          ExpoDay
        </p>
        <p className="font-[family-name:var(--font-expo-display)] text-[22px] uppercase leading-none md:text-[26px]">
          ExpoCannabis 2026
        </p>
        <WindowNote open={phase === "open"} />
        <a
          href={EXPOCANNABIS_PATH}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border-2 border-[#231F20] bg-[#231F20] px-4 text-[15px] font-extrabold text-brand-yellow shadow-[0_4px_0_rgba(35,31,32,0.35)] transition-transform duration-80 active:translate-y-1 active:shadow-none motion-reduce:transition-none md:ml-auto"
        >
          Abrir estande
          <ArrowRight aria-hidden size={18} strokeWidth={2.6} />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </div>
      <div aria-hidden className="relative hidden w-56 flex-none self-stretch md:block">
        <Image
          src="/images/expocannabis/kit-sedas-premium.png"
          alt=""
          width={461}
          height={351}
          className="absolute -top-3 left-2 h-auto w-52 max-w-none -rotate-8"
        />
      </div>
    </aside>
  );
}
