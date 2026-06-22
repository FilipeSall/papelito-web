import { RevendedorFormLabel } from "../atoms/revendedor-form-label";
import { RevendedorTextInput } from "../atoms/revendedor-text-input";

type RevendedorFormFieldProps = {
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  id: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  maxLength?: number;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  prefixContent?: React.ReactNode;
  tone?: "light" | "dark";
  type?: React.HTMLInputTypeAttribute;
  value: string;
};

/**
 * Agrupa label, input e mensagem de erro para campos textuais do formulario.
 */
export function RevendedorFormField({
  autoComplete,
  disabled,
  error,
  id,
  inputMode,
  label,
  maxLength,
  name,
  onChange,
  placeholder,
  prefixContent,
  tone = "light",
  type = "text",
  value,
}: RevendedorFormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <RevendedorFormLabel htmlFor={id} tone={tone}>
        {label}
      </RevendedorFormLabel>
      <RevendedorTextInput
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        disabled={disabled}
        error={error}
        id={id}
        inputMode={inputMode}
        maxLength={maxLength}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        prefixContent={prefixContent}
        tone={tone}
        type={type}
        value={value}
      />
      <span
        id={`${id}-error`}
        className={`min-h-5 text-[11px] tracking-[0.05px] ${
          tone === "dark" ? "text-red-300" : "text-red-500"
        }`}
      >
        {error ?? ""}
      </span>
    </div>
  );
}
