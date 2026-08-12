"use client";

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ModalSection({
  action,
  children,
  helpText,
  title,
}: Readonly<{
  action?: ReactNode;
  children: ReactNode;
  helpText?: string;
  title: string;
}>) {
  return (
    <section className="rounded-[10px] border border-[#c9bd96] bg-[#fff9e9] p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#c9bd96] pb-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#111111]">
          {title}
          {helpText ? <InfoTooltip text={helpText} /> : null}
        </h4>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FieldLabel({ helpText, label }: Readonly<{ helpText?: string; label: string }>) {
  return (
    <span className="flex items-center gap-2 text-sm font-medium leading-none text-[#231f20]">
      {label}
      {helpText ? <InfoTooltip text={helpText} /> : null}
    </span>
  );
}

const TOOLTIP_VIEWPORT_MARGIN = 8;
const TOOLTIP_ANCHOR_GAP = 8;

export function InfoTooltip({ text }: Readonly<{ text: string }>) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  function close() {
    setIsOpen(false);
    setPosition(null);
  }

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function place() {
      const trigger = triggerRef.current;
      const bubble = bubbleRef.current;

      if (!trigger || !bubble) {
        return;
      }

      const anchor = trigger.getBoundingClientRect();
      const { height, width } = bubble.getBoundingClientRect();
      const maxLeft = Math.max(
        TOOLTIP_VIEWPORT_MARGIN,
        window.innerWidth - width - TOOLTIP_VIEWPORT_MARGIN,
      );
      const above = anchor.top - TOOLTIP_ANCHOR_GAP - height;

      setPosition({
        left: Math.min(Math.max(anchor.left, TOOLTIP_VIEWPORT_MARGIN), maxLeft),
        top: above >= TOOLTIP_VIEWPORT_MARGIN ? above : anchor.bottom + TOOLTIP_ANCHOR_GAP,
      });
    }

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen, text]);

  return (
    <span
      className="relative inline-flex shrink-0 items-center self-center align-middle"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={close}
    >
      <button
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-label="Mais informações"
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#c9bd96] bg-white text-[10px] font-black leading-none text-[#231f20] outline-none transition focus-visible:ring-2 focus-visible:ring-[#231f20]/20"
        onBlur={close}
        onFocus={() => setIsOpen(true)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={close}
        ref={triggerRef}
        type="button"
      >
        i
      </button>
      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <span
              className="pointer-events-none fixed left-0 top-0 z-9999 w-72 max-w-[calc(100vw-1rem)] border border-[#231f20] bg-[#231f20] px-3 py-2 text-left text-[11px] font-medium normal-case leading-4 tracking-normal text-[#f5f1e8] shadow-[0_10px_24px_rgba(35,31,32,0.16)]"
              id={tooltipId}
              ref={bubbleRef}
              role="tooltip"
              style={{
                transform: `translate3d(${position?.left ?? 0}px, ${position?.top ?? 0}px, 0)`,
                visibility: position ? "visible" : "hidden",
              }}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

export function TextField({
  error = false,
  helpText,
  inputMode,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: Readonly<{
  error?: boolean;
  helpText?: string;
  inputMode?: "decimal" | "numeric";
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}>) {
  return (
    <label className="grid min-w-0 gap-2">
      <FieldLabel helpText={helpText} label={label} />
      <input
        aria-invalid={error || undefined}
        className={[
          "min-h-12 w-full min-w-0 border bg-white px-5 text-base text-[#231f20] outline-none transition placeholder:text-[#231f20]/36 focus:ring-1",
          error
            ? "border-[#c0392b] focus:border-[#c0392b] focus:ring-[#c0392b]"
            : "border-[#c9bd96] focus:border-[#231f20] focus:ring-[#231f20]",
        ].join(" ")}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

export function PromotionToggle({
  isEnabled,
  onChange,
}: Readonly<{
  isEnabled: boolean;
  onChange: (isEnabled: boolean) => void;
}>) {
  return (
    <label className="flex cursor-pointer items-center gap-3 border-y border-[#c9bd96] py-4 text-sm font-medium text-[#231f20]">
      <input
        checked={isEnabled}
        className="h-5 w-5 accent-brand-yellow"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>Agendar promoção (Sim/Não)</span>
    </label>
  );
}
