import { RevendedorFormLabel } from "../atoms/revendedor-form-label";
import { RevendedorTextInput } from "../atoms/revendedor-text-input";

type RevendedorFormFieldProps = {
  autoComplete?: string;
  error?: string;
  id: string;
  label: string;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  prefixContent?: React.ReactNode;
  type?: React.HTMLInputTypeAttribute;
  value: string;
};

/**
 * Agrupa label, input e mensagem de erro para campos textuais do formulario.
 */
export function RevendedorFormField({
  autoComplete,
  error,
  id,
  label,
  name,
  onChange,
  placeholder,
  prefixContent,
  type = "text",
  value,
}: RevendedorFormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <RevendedorFormLabel htmlFor={id}>{label}</RevendedorFormLabel>
      <RevendedorTextInput
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        error={error}
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        prefixContent={prefixContent}
        type={type}
        value={value}
      />
      <span
        id={`${id}-error`}
        className="min-h-5 text-[11px] tracking-[0.05px] text-red-500"
      >
        {error ?? ""}
      </span>
    </div>
  );
}
