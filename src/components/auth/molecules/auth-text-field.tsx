import { AuthFieldLabel } from "../atoms/auth-field-label";
import { AuthInput } from "../atoms/auth-input";

interface AuthTextFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder: string;
  autoComplete?: string;
}

export function AuthTextField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
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
      />
    </div>
  );
}
