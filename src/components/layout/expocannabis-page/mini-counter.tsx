type MiniCounterProps = {
  qty: number;
  max: number;
  minusLabel: string;
  plusLabel: string;
  onChange: (qty: number) => void;
  large?: boolean;
  /** Versão de 40 px da linha do painel lateral. */
  small?: boolean;
  qtyId?: number;
};

/** Contador de borda preta: 46 px na linha do pedido, 56 px na ficha do produto. */
export function MiniCounter({ qty, max, minusLabel, plusLabel, onChange, large = false, small = false, qtyId }: Readonly<MiniCounterProps>) {
  const height = large ? "h-14" : small ? "h-10" : "h-11.5";
  const box = large ? "h-14 w-13" : small ? "h-10 w-9" : "h-11.5 w-10";
  const number = large ? "min-w-10 text-[20px] font-extrabold" : "min-w-7 text-base font-extrabold";

  return (
    <div className={`flex flex-none items-center border border-expo-ink bg-white text-expo-ink ${height}`}>
      <button type="button" aria-label={minusLabel} className={`${box} text-[20px] font-bold`} onClick={() => onChange(qty - 1)}>
        −
      </button>
      <span data-qty={qtyId} className="sr-only">{`${qty} no pedido`}</span>
      <span aria-hidden className={`num text-center ${number}`}>
        {qty}
      </span>
      <button
        type="button"
        aria-label={plusLabel}
        disabled={qty >= max}
        className={`${box} text-[20px] font-bold disabled:opacity-40`}
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
