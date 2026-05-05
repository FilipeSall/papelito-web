import type { ReactNode } from "react";

import { AuthFieldLabel } from "../atoms/auth-field-label";
import { AuthSelect } from "../atoms/auth-select";

interface AuthSelectFieldProps {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  children: ReactNode;
}

export function AuthSelectField({
  id,
  name,
  label,
  defaultValue,
  required,
  children,
}: AuthSelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <AuthFieldLabel htmlFor={id}>{label}</AuthFieldLabel>
      <AuthSelect id={id} name={name} defaultValue={defaultValue} required={required}>
        {children}
      </AuthSelect>
    </div>
  );
}
