import { AuthFieldLabel } from "../atoms/auth-field-label";
import { AuthInput } from "../atoms/auth-input";

interface AuthTextFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel" | "date";
  placeholder: string;
  autoComplete?: string;
  defaultValue?: string;
  value?: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  maxLength?: number;
  max?: string;
  error?: string;
  hint?: React.ReactNode;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function AuthTextField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  value,
  required,
  readOnly,
  disabled,
  maxLength,
  max,
  error,
  hint,
  inputMode,
  onChange,
}: AuthTextFieldProps) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

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
        value={value}
        required={required}
        readOnly={readOnly}
        disabled={disabled}
        maxLength={maxLength}
        max={max}
        inputMode={inputMode}
        onChange={onChange}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={readOnly || disabled ? "cursor-not-allowed opacity-70" : undefined}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-white/40">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
