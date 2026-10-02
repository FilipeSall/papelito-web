"use client";

import { useLayoutEffect, useRef, useState } from "react";

const VIEWPORT_GUTTER = 16;

/** Lado para onde a camada expandida abre: a partir do início da célula ou do fim dela. */
export type RevealAlign = "start" | "end";

/**
 * Mede se o texto de uma linha truncada corta de verdade e qual é a largura visível dela.
 * Remede a cada redimensionamento do elemento (sem `ResizeObserver`, mede uma vez); só
 * re-renderiza quando o resultado muda.
 * Ligue o `ref` no elemento com `truncate`, não no contêiner.
 */
export function useTextOverflow<T extends HTMLElement = HTMLSpanElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState({ overflowing: false, width: 0 });

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const overflowing = node.scrollWidth > node.clientWidth + 1;
      setState((current) =>
        current.overflowing === overflowing && current.width === node.clientWidth
          ? current
          : { overflowing, width: node.clientWidth },
      );
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, ...state };
}

/** Abre para a esquerda quando a camada inteira não caberia à direita do gatilho. */
export function resolveRevealAlign(trigger: HTMLElement, layer: HTMLElement): RevealAlign {
  const rect = trigger.getBoundingClientRect();
  return rect.left + layer.scrollWidth + VIEWPORT_GUTTER > window.innerWidth ? "end" : "start";
}
