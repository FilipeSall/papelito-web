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
  action?: React.ReactNode;
}

const INPUT_BASE =
  "h-[46px] w-full rounded-[12px] border px-3.5 text-sm tracking-[-0.1504px] text-brand-dark outline-none transition-[background-color,border-color,box-shadow] duration-150 placeholder:text-black/50";

const INPUT_TONE =
  "border-[#E8EAED] bg-[#FBFBFC] hover:border-[#D6D9DE] hover:bg-white focus:border-brand-dark/60 focus:bg-white focus:ring-2 focus:ring-brand-dark/8";

const INPUT_ERROR_TONE =
  "border-[#c0392b]/45 bg-[#FEFAFA] hover:border-[#c0392b]/60 focus:border-[#c0392b]/70 focus:bg-white focus:ring-2 focus:ring-[#c0392b]/10";

export function CheckoutField({
  label,
  placeholder,
  value,
  onChange,
  inputMode,
  maxLength,
  isLoading = false,
  errorMessage,
  action,
}: CheckoutFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            className={`${INPUT_BASE} ${errorMessage ? INPUT_ERROR_TONE : INPUT_TONE}`}
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
        {action}
      </div>
      {errorMessage && (
        <p className="flex items-start gap-1.5 text-xs leading-4 text-[#c0392b]" role="alert">
          <span aria-hidden>⚠</span>
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
