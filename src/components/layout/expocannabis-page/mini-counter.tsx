type MiniCounterProps = {
  qty: number;
  max: number;
  minusLabel: string;
  plusLabel: string;
  onChange: (qty: number) => void;
  large?: boolean;
  qtyId?: number;
};

/** Contador claro −/+ com borda: 40 px na linha do pedido, 56 px no detalhe do produto. */
export function MiniCounter({ qty, max, minusLabel, plusLabel, onChange, large = false, qtyId }: Readonly<MiniCounterProps>) {
  const box = large ? "size-14" : "size-10";
  const number = large ? "min-w-10 text-xl" : "min-w-6.5";

  return (
    <div className="flex flex-none items-center rounded-md border-[1.5px] border-[#E4E4E7]">
      <button
        type="button"
        aria-label={minusLabel}
        className={`${box} text-xl font-bold transition-transform duration-120 active:scale-95 motion-reduce:transition-none`}
        onClick={() => onChange(qty - 1)}
      >
        −
      </button>
      <span data-qty={qtyId} className="sr-only">{`${qty} no pedido`}</span>
      <span aria-hidden key={qty} className={`expo-bump text-center font-extrabold ${number}`}>
        {qty}
      </span>
      <button
        type="button"
        aria-label={plusLabel}
        disabled={qty >= max}
        className={`${box} text-xl font-bold transition-transform duration-120 active:scale-95 disabled:opacity-30 motion-reduce:transition-none`}
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
