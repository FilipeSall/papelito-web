import Image from "next/image";

type KeypadProps = {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  disabled?: boolean;
};

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const KEY =
  "flex h-16.5 items-center justify-center border border-expo-tecla bg-white font-extrabold text-expo-ink active:bg-brand-yellow disabled:opacity-40";

/** Teclado numérico 3×4 da credencial: 1–9, Limpar, 0 e Apagar. A tecla acende em amarelo no toque. */
export function Keypad({ onDigit, onClear, onBackspace, disabled = false }: Readonly<KeypadProps>) {
  return (
    <div role="group" aria-label="Teclado numérico" className="grid grid-cols-3 gap-3">
      {DIGITS.map((digit) => (
        <button key={digit} type="button" className={`${KEY} num text-[30px]`} disabled={disabled} onClick={() => onDigit(digit)}>
          {digit}
        </button>
      ))}
      <button type="button" className={`${KEY} text-[17px]`} disabled={disabled} onClick={onClear}>
        Limpar
      </button>
      <button type="button" className={`${KEY} num text-[30px]`} disabled={disabled} onClick={() => onDigit("0")}>
        0
      </button>
      <button type="button" aria-label="Apagar último número" className={KEY} disabled={disabled} onClick={onBackspace}>
        <Image src="/images/expocannabis/figma/icon-apagar.svg" alt="" width={30} height={24} aria-hidden className="h-6 w-7.5" />
      </button>
    </div>
  );
}
