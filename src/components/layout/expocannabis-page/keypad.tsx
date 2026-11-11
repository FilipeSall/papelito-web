type KeypadProps = {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  disabled?: boolean;
};

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const KEY_CLASS =
  "h-[66px] rounded-md border-2 border-[#231F20] bg-white text-2xl font-extrabold shadow-[0_5px_0_#231F20] transition active:translate-y-[5px] active:shadow-none disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#231F20]";

/** Teclado numérico 3×4 da tela do CNPJ: 1–9, Limpar, 0 e Apagar. */
export function Keypad({ onDigit, onClear, onBackspace, disabled = false }: Readonly<KeypadProps>) {
  return (
    <div role="group" aria-label="Teclado numérico" className="grid grid-cols-3 gap-3">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={KEY_CLASS} disabled={disabled} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <button type="button" className={`${KEY_CLASS} text-base`} disabled={disabled} onClick={onClear}>
        Limpar
      </button>
      <button type="button" className={KEY_CLASS} disabled={disabled} onClick={() => onDigit("0")}>
        0
      </button>
      <button type="button" aria-label="Apagar último número" className={`${KEY_CLASS} text-base`} disabled={disabled} onClick={onBackspace}>
        ⌫
      </button>
    </div>
  );
}
