"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";

import { resolveRevealAlign, useTextOverflow, type RevealAlign } from "@/components/ui/use-text-overflow";

import { FOCUS_RING } from "../../primitives";

const LAYER_OFFSET = 10;

type OverflowRevealProps = {
  /** Texto completo; na célula aparece em uma linha com reticências. */
  text: string;
  /** Destino ao clicar, o mesmo da linha ou do vínculo que a célula representa. */
  href: string;
  /** Tipografia da célula, repetida na camada expandida. */
  className?: string;
  /** Ícone antes do texto, mantido na camada expandida. */
  leading?: ReactNode;
  /** `always` mantém o link mesmo sem overflow (vínculo próprio); `overflow` só cria o link quando corta. */
  interactive?: "always" | "overflow";
  /** Sublinhado no hover, para células que já eram links. */
  underline?: boolean;
};

/**
 * Texto de célula que trunca em uma linha e, só quando corta de verdade, se expande por cima da
 * listagem no hover e no foco, sem mudar largura nem altura da linha.
 * Quando corta, vira link acima do link da linha (`relative z-10`) para receber o ponteiro; por
 * isso exige `href` — o clique segue para o mesmo destino que a linha ou o vínculo já tinham.
 */
export function OverflowReveal({
  className = "",
  href,
  interactive = "overflow",
  leading,
  text,
  underline = false,
}: Readonly<OverflowRevealProps>) {
  const { ref, overflowing, width } = useTextOverflow();
  const layerRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const [align, setAlign] = useState<RevealAlign>("start");
  const content = (
    <span className="flex min-w-0 items-center gap-1.5">
      {leading}
      <span className="block min-w-0 truncate" ref={ref}>
        {text}
      </span>
    </span>
  );

  if (!overflowing && interactive === "overflow") {
    return <span className={`block min-w-0 ${className}`}>{content}</span>;
  }

  function prepare() {
    if (triggerRef.current && layerRef.current) setAlign(resolveRevealAlign(triggerRef.current, layerRef.current));
  }

  const startWidth = width + LAYER_OFFSET * 2 + (leading ? 20 : 0);
  const clipClass = align === "start"
    ? "[clip-path:inset(0_calc(100%-var(--reveal-start))_0_0)]"
    : "[clip-path:inset(0_0_0_calc(100%-var(--reveal-start)))]";

  return (
    <Link
      className={[
        "group/reveal relative z-10 flex w-fit max-w-full min-w-0 hover:z-30 focus-visible:z-30",
        underline ? "underline-offset-2 hover:underline" : "",
        className,
        FOCUS_RING,
      ].join(" ")}
      href={href}
      onFocus={prepare}
      onPointerEnter={prepare}
      ref={triggerRef}
    >
      {content}
      {overflowing ? (
        <span
          aria-hidden
          className={[
            "pointer-events-none absolute -top-1.5 flex w-max max-w-[min(36rem,calc(100vw-2rem))] items-start gap-1.5 border-2 border-[#1a1a1a] bg-white px-2 py-1 whitespace-normal wrap-break-word opacity-0 shadow-[4px_4px_0px_#1a1a1a] transition-[opacity,clip-path] duration-200 ease-out motion-reduce:transition-none",
            "group-hover/reveal:opacity-100 group-hover/reveal:[clip-path:inset(0)] group-focus-visible/reveal:opacity-100 group-focus-visible/reveal:[clip-path:inset(0)]",
            align === "start" ? "-left-2.5" : "-right-2.5",
            clipClass,
          ].join(" ")}
          ref={layerRef}
          style={{ "--reveal-start": `${startWidth}px` } as CSSProperties}
        >
          {leading ? <span className="mt-0.5 shrink-0">{leading}</span> : null}
          <span className="min-w-0">{text}</span>
        </span>
      ) : null}
    </Link>
  );
}
