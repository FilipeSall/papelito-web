"use client";

import type { ReactNode } from "react";

export function ModalSection({
  action,
  children,
  helpText,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  helpText?: string;
  title: string;
}) {
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

export function FieldLabel({ helpText, label }: { helpText?: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm font-medium leading-none text-[#231f20]">
      {label}
      {helpText ? <InfoTooltip text={helpText} /> : null}
    </span>
  );
}

export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex shrink-0 items-center self-center align-middle">
      <span
        aria-label="Mais informações"
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#c9bd96] bg-white text-[10px] font-black leading-none text-[#231f20] outline-none transition focus-visible:ring-2 focus-visible:ring-[#231f20]/20"
        role="button"
        tabIndex={0}
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-[9999] invisible mb-2 w-72 -translate-y-1 border border-[#231f20] bg-[#231f20] px-3 py-2 text-left text-[11px] font-medium normal-case leading-4 tracking-normal text-[#f5f1e8] opacity-0 shadow-[0_10px_24px_rgba(35,31,32,0.16)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {text}
      </span>
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
}: {
  error?: boolean;
  helpText?: string;
  inputMode?: "decimal" | "numeric";
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
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
}: {
  isEnabled: boolean;
  onChange: (isEnabled: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 border-y border-[#c9bd96] py-4 text-sm font-medium text-[#231f20]">
      <input
        checked={isEnabled}
        className="h-5 w-5 accent-brand-yellow"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      Agendar promoção (Sim/Não)
    </label>
  );
}
