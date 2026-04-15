import { SpinnerIcon } from "./checkout-icons";

export interface CheckoutFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export function CheckoutField({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
  maxLength,
  isLoading = false,
  errorMessage,
}: CheckoutFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-[0.6px] text-text-tertiary">
        {label}
      </label>
      <div className="relative">
        <input
          className={`h-[46px] w-full rounded-[14px] border bg-white px-4 text-sm tracking-[-0.1504px] text-brand-dark outline-none placeholder:text-black/50 focus:border-brand-dark/25 ${
            errorMessage ? "border-red-400" : "border-[#E5E7EB]"
          }`}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type="text"
          value={value}
        />
        {isLoading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <SpinnerIcon />
          </span>
        )}
      </div>
      {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
    </div>
  );
}
