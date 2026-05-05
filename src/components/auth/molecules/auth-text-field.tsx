import { AuthFieldLabel } from "../atoms/auth-field-label";
import { AuthInput } from "../atoms/auth-input";

interface AuthTextFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  placeholder: string;
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
}

export function AuthTextField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  required,
}: AuthTextFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <AuthFieldLabel htmlFor={id}>{label}</AuthFieldLabel>
      <AuthInput
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}
