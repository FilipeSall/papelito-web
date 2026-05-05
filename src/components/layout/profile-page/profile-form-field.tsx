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
      <label className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className={`h-[46px] w-full rounded-[10px] border px-4 py-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-yellow disabled:bg-gray-50 disabled:text-text-muted ${
          errorMessage ? "border-red-400" : "border-gray-200"
        }`}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {errorMessage ? <p className="text-xs text-red-500">{errorMessage}</p> : null}
    </div>
  );
}
