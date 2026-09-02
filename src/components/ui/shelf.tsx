"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { BrandArrowIcon } from "./icons";
import { ScribbleRule } from "./scribble-rule";

interface ShelfProps {
  labelledBy: string;
  children: ReactNode;
  gap?: "tight" | "wide";
  onDark?: boolean;
  /** Régua embaixo da fileira: reta, traço à mão riscado na entrada, ou nenhuma. */
  rule?: "straight" | "scribble" | "none";
}

const GAP = {
  tight: "gap-3",
  wide: "gap-5",
} as const;

/* As setas flutuam sobre as pontas do trilho em vez de ladeá-lo: ladeando, elas
   empurravam o primeiro card para dentro e quebravam o alinhamento com a etiqueta. */
const ARROW_CLASS =
  "absolute top-[calc(50%-0.75rem)] z-10 -mt-5.5 hidden size-11 items-center justify-center border-2 transition-[background-color,color,box-shadow,translate,rotate] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-brand-yellow active:translate-x-px active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0 md:flex";

const ARROW_TONE = {
  light:
    "border-brand-dark bg-white text-brand-dark shadow-[3px_3px_0_#231f20] hover:bg-brand-dark hover:text-brand-yellow active:shadow-[1px_1px_0_#231f20]",
  dark:
    "border-brand-yellow bg-brand-dark text-brand-yellow shadow-[3px_3px_0_#ffe500] hover:bg-brand-yellow hover:text-brand-dark active:shadow-[1px_1px_0_#ffe500]",
} as const;

const ARROW_ICON_CLASS = "size-4 shrink-0 transition-transform duration-300 ease-in-out motion-reduce:transition-none";

/**
 * Trilho da prateleira: a fileira corre na horizontal com encaixe, apoiada numa
 * régua amarela que marca onde a fileira comeca e termina.
 */
export function Shelf({
  labelledBy,
  children,
  gap = "wide",
  onDark = false,
  rule = "straight",
}: Readonly<ShelfProps>) {
  const railRef = useRef<HTMLUListElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const syncBounds = useCallback(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    // A tolerância acompanha o respiro lateral do trilho: com encaixe obrigatório
    // o navegador para em scrollLeft = RAIL_BLEED no início, e um valor menor que
    // isso leria como "dá pra voltar".
    const SNAP_TOLERANCE = 20;

    setCanScrollBack(rail.scrollLeft > SNAP_TOLERANCE);
    setCanScrollForward(rail.scrollLeft < maxScroll - SNAP_TOLERANCE);
  }, []);

  useEffect(() => {
    syncBounds();

    const rail = railRef.current;

    if (!rail || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(syncBounds);

    observer.observe(rail);

    return () => observer.disconnect();
  }, [syncBounds]);

  /**
   * O passo é um múltiplo exato do card, não uma fração da largura do trilho.
   * Com `scroll-snap: mandatory`, um passo quebrado cai entre dois pontos de
   * encaixe e o navegador reancora onde quer — o clique parecia não funcionar.
   */
  const scrollByStep = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    const firstItem = rail?.firstElementChild;

    if (!rail || !(firstItem instanceof HTMLElement)) {
      return;
    }

    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    const pitch = firstItem.offsetWidth + gap;

    if (pitch <= 0) {
      return;
    }

    const visible = Math.floor((rail.clientWidth + gap) / pitch);
    const cards = Math.max(1, visible - 1);

    rail.scrollBy({ left: pitch * cards * direction, behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-col">
      <div className="relative">
        <ul
          aria-labelledby={labelledBy}
          className={`shelf-rail -mx-3 flex overflow-x-auto px-3 pb-6 pt-3 ${GAP[gap]}`}
          onScroll={syncBounds}
          ref={railRef}
        >
          {children}
        </ul>

        {/* A seta só existe quando há para onde ir: desabilitada, ela ficava por
            cima do primeiro card e comia o nome do produto. */}
        {canScrollBack ? (
          <button
            aria-label="Voltar na prateleira"
            className={`group/arrow ${ARROW_CLASS} ${ARROW_TONE[onDark ? "dark" : "light"]} -left-5.5 -rotate-[1.4deg] hover:rotate-0 motion-reduce:hover:-rotate-[1.4deg]`}
            onClick={() => scrollByStep(-1)}
            type="button"
          >
            <BrandArrowIcon
              className={`${ARROW_ICON_CLASS} -rotate-180 group-hover/arrow:-translate-x-1.5 group-hover/arrow:rotate-[-195deg] motion-reduce:group-hover/arrow:translate-x-0 motion-reduce:group-hover/arrow:-rotate-180`}
            />
          </button>
        ) : null}

        {canScrollForward ? (
          <button
            aria-label="Avançar na prateleira"
            className={`group/arrow ${ARROW_CLASS} ${ARROW_TONE[onDark ? "dark" : "light"]} -right-5.5 rotate-[0.9deg] hover:rotate-0 motion-reduce:hover:rotate-[0.9deg]`}
            onClick={() => scrollByStep(1)}
            type="button"
          >
            <BrandArrowIcon
              className={`${ARROW_ICON_CLASS} group-hover/arrow:translate-x-1.5 group-hover/arrow:rotate-[15deg] motion-reduce:group-hover/arrow:translate-x-0 motion-reduce:group-hover/arrow:rotate-0`}
            />
          </button>
        ) : null}
      </div>

      {rule === "scribble" ? <ScribbleRule className="w-full text-brand-yellow" /> : null}
      {rule === "straight" ? (
        <div aria-hidden className="h-1 w-full bg-brand-yellow" />
      ) : null}
    </div>
  );
}
