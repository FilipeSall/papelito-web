"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, CircleAlert, Copy } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import { resolveRevealAlign, useTextOverflow, type RevealAlign } from "@/components/ui/use-text-overflow";

const LAYER_OFFSET = 10;
const COPY_RESET_MS = 1600;
const VALUE_CLASS = "font-(family-name:--font-admin-mono) font-semibold tracking-[0.04em] normal-case";

type CopyState = "idle" | "copied" | "failed";

const COPY_ICONS = { idle: Copy, copied: Check, failed: CircleAlert } as const;
const COPY_ANNOUNCEMENTS: Record<CopyState, string> = {
  idle: "",
  copied: "SKU copiado",
  failed: "Não foi possível copiar o SKU",
};

function useCopy(value: string) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), COPY_RESET_MS);
  }

  return { state, copy };
}

function SkuCopyButton({ value, revealOnHover = false }: Readonly<{ value: string; revealOnHover?: boolean }>) {
  const { state, copy } = useCopy(value);
  const Icon = COPY_ICONS[state];
  const visibility = revealOnHover
    ? "opacity-0 group-hover/sku:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
    : "";

  return (
    <>
      <button
        aria-label={`Copiar SKU ${value}`}
        className={`-my-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center text-[#1a1a1a]/55 transition hover:bg-brand-yellow hover:text-[#1a1a1a] ${visibility} ${FOCUS_RING}`}
        onClick={() => void copy()}
        title="Copiar SKU"
        type="button"
      >
        <Icon aria-hidden className="size-3.5" strokeWidth={2.4} />
      </button>
      <span aria-live="polite" className="sr-only">
        {COPY_ANNOUNCEMENTS[state]}
      </span>
    </>
  );
}

function clipClassFor(align: RevealAlign) {
  return align === "start"
    ? "-left-2.5 [clip-path:inset(0_calc(100%-var(--reveal-start))_0_0)]"
    : "-right-2.5 [clip-path:inset(0_0_0_calc(100%-var(--reveal-start)))]";
}

/**
 * SKU da linha de estoque em uma linha só, com botão de copiar discreto (sempre visível em toque).
 * O valor tem teto de largura próprio: em tabela de layout automático a célula cresceria até
 * caber o texto e o `truncate` nunca agiria.
 * Quando o valor corta, cresce por cima da lista no hover e no foco — a mesma animação de
 * `OverflowReveal` no admin — e o botão de copiar passa a morar na camada expandida.
 */
export function StockSku({ value }: Readonly<{ value: string }>) {
  const { ref, overflowing, width } = useTextOverflow();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const layerRef = useRef<HTMLSpanElement>(null);
  const [align, setAlign] = useState<RevealAlign>("start");

  function prepare() {
    if (wrapRef.current && layerRef.current) setAlign(resolveRevealAlign(wrapRef.current, layerRef.current));
  }

  return (
    <span
      className="group/sku relative flex min-w-0 items-center gap-1 hover:z-30 focus-within:z-30"
      onFocus={prepare}
      onPointerEnter={prepare}
      ref={wrapRef}
    >
      <span className={`block min-w-0 max-w-40 truncate ${VALUE_CLASS}`} ref={ref}>
        {value}
      </span>
      {overflowing ? (
        <span
          className={[
            "pointer-events-none absolute -top-1.5 z-30 flex w-max max-w-[min(32rem,calc(100vw-2rem))] items-center gap-1 border-2 border-[#1a1a1a] bg-white py-0.5 pr-0.5 pl-2 text-[#1a1a1a] opacity-0 shadow-[4px_4px_0px_#1a1a1a] transition-[opacity,clip-path] duration-200 ease-out motion-reduce:transition-none",
            "group-focus-within/sku:pointer-events-auto group-focus-within/sku:opacity-100 group-focus-within/sku:[clip-path:inset(0)] group-hover/sku:pointer-events-auto group-hover/sku:opacity-100 group-hover/sku:[clip-path:inset(0)]",
            clipClassFor(align),
          ].join(" ")}
          ref={layerRef}
          style={{ "--reveal-start": `${width + LAYER_OFFSET * 2}px` } as CSSProperties}
        >
          <span aria-hidden className={`break-all ${VALUE_CLASS}`}>
            {value}
          </span>
          <SkuCopyButton value={value} />
        </span>
      ) : (
        <SkuCopyButton revealOnHover value={value} />
      )}
    </span>
  );
}
