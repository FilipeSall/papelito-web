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
    <div className="flex flex-col gap-2.5">
      <label className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-dark/70">
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={`h-13 w-full rounded-[18px] border px-4 py-3 text-[15px] font-medium text-brand-dark outline-none transition-[border-color,box-shadow,background-color,color] placeholder:text-brand-dark/35 focus:bg-white disabled:cursor-not-allowed disabled:bg-[#F4F1EA] disabled:text-text-muted ${
          errorMessage
            ? "border-red-300 bg-red-50/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] focus:border-red-400 focus:ring-4 focus:ring-red-100"
            : "border-[#D8D1C2] bg-[#FFFDF8] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(35,31,32,0.03)] focus:border-brand-yellow focus:ring-4 focus:ring-[#FFF1A6]"
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
        <p className="px-1 text-[11px] font-medium tracking-[0.01em] text-red-500">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
