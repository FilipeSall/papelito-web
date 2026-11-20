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

/** Trilho do retrato: nível, régua e "Ver pedido". Dá um respiro a cada mudança de quantidade. */
export function OrderBar({ levels, units, totalCents, onOpen }: Readonly<OrderBarProps>) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useBreathe(buttonRef, units);

  return (
    <div className="flex flex-none flex-col gap-2.5 bg-expo-noite px-6 pb-4 pt-4 pz:hidden">
      <LevelBar levels={levels} units={units} dark />
      <button
        ref={buttonRef}
        type="button"
        disabled={units === 0}
        onClick={onOpen}
        className="flex min-h-15.5 w-full items-center justify-between gap-3 bg-brand-yellow px-5 text-expo-ink disabled:bg-expo-cinza disabled:text-expo-zinc"
      >
        <span className="num text-[18px] font-extrabold">{`Ver pedido · ${units} ${units === 1 ? "unidade" : "unidades"}`}</span>
        <span className="num text-[20px] font-bold">{formatCents(totalCents)}</span>
      </button>
    </div>
  );
}
