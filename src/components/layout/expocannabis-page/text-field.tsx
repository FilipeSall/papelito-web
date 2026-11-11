import type { HTMLAttributes } from "react";

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  flash?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  type?: string;
  className?: string;
};

/** Campo de 52 px do checkout com rótulo, erro abaixo e o flash de preenchimento pelo CEP. */
export function TextField({ id, label, value, onChange, error, flash = false, inputMode, autoComplete, type = "text", className = "" }: Readonly<TextFieldProps>) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-extrabold uppercase tracking-[0.08em]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-1 h-[52px] w-full rounded-md border-2 px-3 text-base font-semibold transition-colors duration-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#231F20] ${error ? "border-[#B42318] bg-[#FFF1F0]" : "border-[#D4D4D8]"} ${flash ? "bg-[#FFF7A6]" : ""}`}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-sm font-semibold text-[#B42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
