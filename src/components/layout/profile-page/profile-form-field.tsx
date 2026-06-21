"use client";

import { InputHTMLAttributes } from "react";

type ProfileFormFieldProps = {
  /** Label exibido acima do campo */
  label: string;
  /** Valor atual do campo */
  value: string;
  /** Tipo do input HTML */
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
  /** Placeholder do campo */
  placeholder?: string;
  /** Auto complete do campo */
  autoComplete?: string;
  /** Se o campo esta desabilitado */
  disabled?: boolean;
  /** Input mode do campo */
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  /** Comprimento maximo */
  maxLength?: number;
  /** Mensagem de erro */
  errorMessage?: string;
  /** Callback de mudanca de valor */
  onChange?: (value: string) => void;
};

/**
 * Campo de formulario do perfil do usuario.
 *
 * Componente atomico que renderiza um input com label estilizado
 * seguindo o design system do Papelito.
 *
 * @example
 * ```tsx
 * <ProfileFormField
 *   label="Nome Completo"
 *   value={name}
 *   onChange={setName}
 * />
 * ```
 */
export function ProfileFormField({
  label,
  value,
  type = "text",
  placeholder,
  autoComplete,
  disabled = false,
  inputMode,
  maxLength,
  errorMessage,
  onChange,
}: ProfileFormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={`h-11 w-full rounded-none border-2 bg-white px-3 text-sm font-medium text-[#1a1a1a] outline-none transition-[border-color] placeholder:font-normal placeholder:text-[#1a1a1a]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow disabled:cursor-not-allowed disabled:bg-[#faf8f2] disabled:text-[#1a1a1a]/40 ${
          errorMessage
            ? "border-[#c0392b] focus:border-[#c0392b]"
            : "border-[#1a1a1a] focus:border-[#1a1a1a]"
        }`}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {errorMessage ? (
        <p className="text-[11px] font-semibold text-[#c0392b]">
          ⚠ {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
