"use client";

import { useState } from "react";

import { PasswordRevealButton } from "@/components/ui/password-reveal-button";

import { InfoTooltip } from "../../products/components/form-fields";

function fieldClass(hasError = false, disabled = false) {
  const stateClass = disabled
    ? "cursor-not-allowed border-dashed border-[#1a1a1a]/25 bg-[#1a1a1a]/5 text-[#1a1a1a]/40 placeholder:text-[#1a1a1a]/30"
    : "bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 focus:border-[#1a1a1a]";
  let borderClass = "border-[#1a1a1a]";

  if (disabled) {
    borderClass = "";
  } else if (hasError) {
    borderClass = "border-[#c0392b]";
  }

  return [
    "mt-2 h-11 w-full rounded-none border-2 px-3 text-sm outline-none transition",
    "focus:ring-0",
    stateClass,
    borderClass,
  ].join(" ");
}

export function Field({
  autoComplete,
  disabled = false,
  error,
  helpText,
  helperText,
  inputMode,
  label,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: Readonly<{
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  helperText?: string;
  inputMode?: "decimal" | "email" | "numeric" | "tel" | "text";
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}>) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="flex h-4 items-center gap-1.5 text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]">
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        {helpText ? <InfoTooltip text={helpText} /> : null}
      </span>
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className={`${fieldClass(Boolean(error), disabled)} ${isPassword ? "pr-12" : ""}`}
          disabled={disabled}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={isPassword && isPasswordVisible ? "text" : type}
          value={value}
        />
        {isPassword ? (
          <PasswordRevealButton
            disabled={disabled}
            isVisible={isPasswordVisible}
            onToggle={() => setIsPasswordVisible((current) => !current)}
          />
        ) : null}
      </div>
      {error ? <span className="mt-1 block text-[11px] font-semibold text-[#c0392b]">{error}</span> : null}
      {!error && helperText ? (
        <span className="mt-1 block text-[11px] text-[#1a1a1a]/50">{helperText}</span>
      ) : null}
    </label>
  );
}

export function Section({ children, title }: Readonly<{ children: React.ReactNode; title: string }>) {
  return (
    <section className="border-t-2 border-[#1a1a1a]/10 pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" aria-hidden="true" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">{title}</h4>
      </div>
      {children}
    </section>
  );
}


