"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** true quando a pessoa pediu "reduzir movimento" no sistema. */
export function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Pulo do PRODUTO (não do card) quando a quantidade muda: subiu, o display salta e
 * inclina; desceu, afunda e volta. Anima pela Web Animations API porque o elemento
 * não pode remontar: remontar a <img> recarrega a foto e pisca.
 */
export function useJump<T extends HTMLElement>(value: number) {
  const ref = useRef<T>(null);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    const up = value > previous.current;
    previous.current = value;
    const element = ref.current;
    if (!element || reducedMotion() || !element.animate) return;
    element.animate(
      up
        ? [
            { transform: "none" },
            { transform: "translateY(-10px) rotate(-3deg)", offset: 0.35 },
            { transform: "translateY(2px) rotate(1deg)", offset: 0.7 },
            { transform: "none" },
          ]
        : [{ transform: "none" }, { transform: "translateY(4px) scale(0.96)", offset: 0.4 }, { transform: "none" }],
      { duration: up ? 480 : 320, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
  }, [value]);

  return ref;
}

/** Escala de um "palco" com o tamanho do Figma para caber na largura disponível. */
export function useStageScale<T extends HTMLElement>(originalWidth: number) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setScale(element.clientWidth / originalWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [originalWidth]);

  return [ref, scale] as const;
}
