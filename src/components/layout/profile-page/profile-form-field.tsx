"use client";

import { type InputHTMLAttributes, type ReactNode, useId, useState } from "react";

import { PasswordRevealButton } from "@/components/ui/password-reveal-button";

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
  inputClassName?: string;
  disabledClassName?: string;
  /** Input mode do campo */
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  /** Comprimento maximo */
  maxLength?: number;
  /** Mensagem de erro */
  errorMessage?: string;
  /** Callback de mudanca de valor */
  onChange?: (value: string) => void;
  /** Se o campo pode ser alterado */
  readOnly?: boolean;
  /** Ação posicionada dentro do lado direito do campo */
  endAdornment?: ReactNode;
  /** Elemento de ajuda ao lado do rótulo */
  labelAccessory?: ReactNode;
  /** Elemento decorativo posicionado dentro do lado esquerdo do campo */
  startAdornment?: ReactNode;
};

/**
 * Campo de texto controlado do formulário de perfil, com rótulo, mensagem de
 * erro acessível (`aria-invalid` + `aria-describedby`) e slots opcionais nas
 * duas pontas do input.
 *
 * Quando `type="password"`, o botão de revelar senha é adicionado sozinho e
 * alterna o tipo real do input entre `password` e `text`.
 *
 * @example
 * ```tsx
 * <ProfileFormField
 *   label="Nome Completo"
 *   value={name}
 *   onChange={setName}
 *   errorMessage={errors.name}
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
  inputClassName,
  disabledClassName,
  inputMode,
  maxLength,
  errorMessage,
  onChange,
  readOnly = false,
  endAdornment,
  labelAccessory,
  startAdornment,
}: Readonly<ProfileFormFieldProps>) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const fieldId = useId();
  const errorId = `${fieldId}-erro`;
  const isPassword = type === "password";
  const resolvedType = isPassword && isPasswordVisible ? "text" : type;
  const needsEndPadding = isPassword || Boolean(endAdornment);
  const startPadding = startAdornment ? "pl-11" : "pl-3";
  const endPadding = needsEndPadding ? "pr-12" : "pr-3";
  const inputPadding = `${startPadding} ${endPadding}`;
  const disabledStyles =
    disabledClassName ??
    "disabled:cursor-not-allowed disabled:bg-[#faf8f2] disabled:text-[#1a1a1a]/40";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label
          className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
          htmlFor={fieldId}
        >
          {label}
        </label>
        {labelAccessory}
      </div>
      <div className="relative">
        <input
          aria-describedby={errorMessage ? errorId : undefined}
          aria-invalid={errorMessage ? true : undefined}
          autoComplete={autoComplete}
          className={`h-11 w-full rounded-none border-2 bg-white text-sm font-medium text-[#1a1a1a] outline-none transition-[border-color] placeholder:font-normal placeholder:text-[#1a1a1a]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow ${disabledStyles} ${inputPadding} ${
            errorMessage
              ? "border-[#c0392b] focus:border-[#c0392b]"
              : "border-[#1a1a1a] focus:border-[#1a1a1a]"
          } ${inputClassName ?? ""}`}
          disabled={disabled}
          id={fieldId}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          type={resolvedType}
          value={value}
        />
        {startAdornment ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 grid h-11 w-11 place-items-center text-[#1a1a1a]/55"
          >
            {startAdornment}
          </div>
        ) : null}
        {isPassword ? (
          <PasswordRevealButton
            disabled={disabled}
            isVisible={isPasswordVisible}
            onToggle={() => setIsPasswordVisible((current) => !current)}
          />
        ) : null}
        {endAdornment ? (
          <div className="absolute bottom-0 right-0 h-11 w-11">
            {endAdornment}
          </div>
        ) : null}
      </div>
      {errorMessage ? (
        <p className="text-[11px] font-semibold text-[#c0392b]" id={errorId}>
          ⚠ {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
