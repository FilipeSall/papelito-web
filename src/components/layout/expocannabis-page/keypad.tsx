type KeypadProps = {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  disabled?: boolean;
};

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const KEY_BASE_CLASS =
  "flex h-[66px] items-center justify-center gap-2 rounded-md border-2 border-[#231F20] font-extrabold shadow-[0_5px_0_#231F20] transition-[transform,box-shadow] duration-80 active:translate-y-[5px] active:shadow-none disabled:opacity-40 motion-reduce:transition-none";

const KEY_CLASS = `${KEY_BASE_CLASS} bg-white text-[30px]`;

const FN_KEY_CLASS = `${KEY_BASE_CLASS} bg-[#F4F4F5] text-[17px]`;

/** Teclado numérico 3×4 da credencial do CNPJ: 1–9, Limpar, 0 e Apagar. */
export function Keypad({ onDigit, onClear, onBackspace, disabled = false }: Readonly<KeypadProps>) {
  return (
    <div role="group" aria-label="Teclado numérico" className="grid grid-cols-3 gap-2.5">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={KEY_CLASS} disabled={disabled} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <button type="button" className={FN_KEY_CLASS} disabled={disabled} onClick={onClear}>
        Limpar
      </button>
      <button type="button" className={KEY_CLASS} disabled={disabled} onClick={() => onDigit("0")}>
        0
      </button>
      <button type="button" aria-label="Apagar último número" className={FN_KEY_CLASS} disabled={disabled} onClick={onBackspace}>
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none" stroke="#231F20" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
          <path d="M9 3h18v18H9L2 12Z" />
          <path d="m14 8 8 8M22 8l-8 8" />
        </svg>
      </button>
    </div>
  );
}
