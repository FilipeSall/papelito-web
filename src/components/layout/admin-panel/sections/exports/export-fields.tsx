"use client";

import type { ReactNode } from "react";

import { FOCUS_RING } from "../../primitives";

export const EXPORT_FORMATS = [
  { label: "XLSX", value: "xlsx" },
  { label: "CSV", value: "csv" },
] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number]["value"];

const DATE_INPUT_CLASS = [
  "min-h-11 w-full min-w-0 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm font-semibold tabular-nums text-[#1a1a1a] sm:w-40",
  FOCUS_RING,
].join(" ");

export function ExportFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">
      {children}
    </span>
  );
}

export function ExportDateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <ExportFieldLabel>{label}</ExportFieldLabel>
      <input
        className={DATE_INPUT_CLASS}
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

export function ExportChoiceField<T extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: string;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{label}</legend>
      <ExportFieldLabel>{label}</ExportFieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            className={[
              "inline-flex min-h-11 cursor-pointer items-center rounded-none border-2 border-[#1a1a1a] px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-colors",
              value === option.value
                ? "bg-brand-yellow text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
                : "bg-white text-[#1a1a1a] hover:bg-[#f7f2e7]",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#1a1a1a]",
            ].join(" ")}
            key={option.value}
          >
            <input
              checked={value === option.value}
              className="sr-only"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExportSubmitButton({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-6 text-center text-[11px] font-black uppercase tracking-[0.16em] text-brand-yellow transition-colors hover:bg-[#000] disabled:cursor-not-allowed disabled:border-[#1a1a1a]/35 disabled:bg-[#1a1a1a]/35 disabled:text-[#fbf7ef]",
        FOCUS_RING,
        className ?? "",
      ].join(" ")}
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

export function ExportFeedback({
  error,
  message,
}: {
  error: string;
  message: string;
}) {
  return (
    <>
      <p aria-live="polite" className="text-sm leading-6 text-[#1a1a1a]/72">
        {message}
      </p>
      {error ? (
        <p
          className="border-2 border-[#9d3b2f] bg-[#9d3b2f]/10 px-4 py-3 text-sm font-semibold leading-6 text-[#7a3428]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </>
  );
}
