"use client";

import { useEffect, useRef, type RefObject } from "react";

import type { EventLevel } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";

import { LevelBar } from "./level-bar";

type OrderBarProps = {
  levels: EventLevel[];
  units: number;
  totalCents: number;
  onOpen: () => void;
};

function useBreathe(ref: RefObject<HTMLElement | null>, trigger: number) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const element = ref.current;
    if (!element) return;
    element.classList.remove("expo-breathe");
    element.getBoundingClientRect();
    element.classList.add("expo-breathe");
  }, [ref, trigger]);
}

/** Barra preta fixa do retrato: nível, trechos e "Ver pedido". Dá um respiro a cada mudança de quantidade. */
export function OrderBar({ levels, units, totalCents, onOpen }: Readonly<OrderBarProps>) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useBreathe(buttonRef, units);

  return (
    <div className="flex flex-none flex-col gap-3 bg-[#231F20] px-6 pb-4.5 pt-3.5 min-[1024px]:hidden">
      <LevelBar levels={levels} units={units} dark />
      <button
        ref={buttonRef}
        type="button"
        disabled={units === 0}
        onClick={onOpen}
        className="flex min-h-15 w-full items-center justify-between rounded-lg bg-brand-yellow px-5 text-lg font-extrabold text-[#231F20] transition-transform duration-120 focus-visible:outline-brand-yellow active:scale-95 disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#71717a] motion-reduce:transition-none"
      >
        <span>{`Ver pedido · ${units} ${units === 1 ? "unidade" : "unidades"}`}</span>
        <span>{formatCents(totalCents)}</span>
      </button>
    </div>
  );
}
