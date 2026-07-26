import type { ReactNode } from "react";

import { AuthFieldLabel } from "../atoms/auth-field-label";
import { AuthSelect } from "../atoms/auth-select";

interface AuthSelectFieldProps {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  required?: boolean;
  children: ReactNode;
}

export function AuthSelectField({
  id,
  name,
  label,
  defaultValue,
  value,
  onChange,
  required,
  children,
}: AuthSelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <AuthFieldLabel htmlFor={id}>{label}</AuthFieldLabel>
      <AuthSelect
        id={id}
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        required={required}
      >
        {children}
      </AuthSelect>
    </div>
  );
}
