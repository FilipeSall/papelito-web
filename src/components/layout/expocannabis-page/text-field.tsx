import type { HTMLAttributes } from "react";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Marca o campo como inválido sem mostrar mensagem própria (a mensagem mora em `describedBy`). */
  invalid?: boolean;
  describedBy?: string;
  /** Contador do flash de preenchimento pelo CEP: 0 não pisca; um valor novo pisca de novo. */
  flash?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  className?: string;
};

/** Campo de 52 px do checkout: rótulo, borda preta, erro vermelho abaixo e flash amarelo quando o CEP preenche. */
export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  invalid = false,
  describedBy,
  flash = 0,
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  type = "text",
  className = "",
}: Readonly<TextFieldProps>) {
  const errorId = `${id}-error`;
  const bad = Boolean(error) || invalid;
  const surface = bad ? "border-2 border-expo-erro bg-white" : "border border-expo-ink bg-white";
  const flashing = flash > 0 && !bad ? "expo-flash" : "";
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      <input
        key={flash}
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete ?? "off"}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={bad ? true : undefined}
        aria-describedby={error ? errorId : describedBy}
        className={`h-13 w-full px-3.5 text-[17px] font-semibold text-expo-ink outline-none transition-colors duration-150 motion-reduce:transition-none ${surface} ${flashing}`}
      />
      {error ? (
        <p id={errorId} className="text-sm font-bold text-expo-erro">
          {error}
        </p>
      ) : null}
    </div>
  );
}
