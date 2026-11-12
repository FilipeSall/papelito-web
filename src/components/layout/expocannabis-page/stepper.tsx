type StepperProps = {
  productName: string;
  qty: number;
  max: number;
  onChange: (qty: number) => void;
  qtyId?: number;
};

const STEP_BUTTON =
  "size-11 text-2xl font-bold text-brand-yellow transition-transform duration-120 active:scale-95 disabled:opacity-30 motion-reduce:transition-none";

/** Contador escuro do card: − e + amarelos, número branco que dá um pulinho. Em 0 o card volta a mostrar "Adicionar". */
export function Stepper({ productName, qty, max, onChange, qtyId }: Readonly<StepperProps>) {
  return (
    <div className="expo-swap mt-1 flex h-11.5 items-center justify-between rounded-md bg-[#231F20]">
      <button type="button" aria-label={`Tirar 1 de ${productName}`} className={STEP_BUTTON} onClick={() => onChange(qty - 1)}>
        −
      </button>
      <span data-qty={qtyId} className="sr-only">{`${qty} no pedido`}</span>
      <span aria-hidden key={qty} className="expo-bump text-[17px] font-extrabold text-white">
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Colocar 1 de ${productName}`}
        className={STEP_BUTTON}
        disabled={qty >= max}
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
