"use client";

import type { ReactNode } from "react";

export function ModalSection({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[10px] border border-[#c9bd96] bg-[#fff9e9] p-5">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#c9bd96] pb-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#111111]">
          {title}
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
    <span className="group relative inline-flex">
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-[#c9bd96] bg-white text-[10px] font-black leading-none text-[#231f20]">
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-[9999] mb-2 hidden w-72 border border-[#231f20] bg-[#231f20] px-3 py-2 text-left text-[11px] font-medium normal-case leading-4 tracking-normal text-[#f5f1e8] shadow-[0_10px_24px_rgba(35,31,32,0.16)] group-hover:block">
        {text}
      </span>
    </span>
  );
}

export function TextField({
  helpText,
  inputMode,
  label,
  onChange,
  type = "text",
  value,
}: {
  helpText?: string;
  inputMode?: "decimal" | "numeric";
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel helpText={helpText} label={label} />
      <input
        className="min-h-12 border border-[#c9bd96] bg-white px-5 text-base text-[#231f20] outline-none transition placeholder:text-[#231f20]/36 focus:border-[#231f20] focus:ring-1 focus:ring-[#231f20]"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
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
      Agendar promocao (Sim/Nao)
    </label>
  );
}
