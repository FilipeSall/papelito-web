"use client";

import { useState } from "react";

import { AuthFieldLabel } from "../atoms/auth-field-label";
import { AuthIconButton } from "../atoms/auth-icon-button";
import { AuthInput } from "../atoms/auth-input";
import { EyeIcon, EyeOffIcon } from "../atoms/auth-icons";

interface AuthPasswordFieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}

export function AuthPasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete,
  required,
  minLength,
}: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <AuthFieldLabel htmlFor={id}>{label}</AuthFieldLabel>
      <div className="relative">
        <AuthInput
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="pr-12"
        />
        <AuthIconButton
          onClick={() => setShowPassword((currentState) => !currentState)}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? (
            <EyeOffIcon className="h-4 w-4" />
          ) : (
            <EyeIcon className="h-4 w-4" />
          )}
        </AuthIconButton>
      </div>
    </div>
  );
}
