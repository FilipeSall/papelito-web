type StepperProps = {
  productName: string;
  qty: number;
  max: number;
  onChange: (qty: number) => void;
  qtyId?: number;
};

const STEP_BUTTON = "flex h-12 w-11 items-center justify-center text-2xl font-bold disabled:opacity-40";

/** Contador do card: faixa amarela de 48 px com − e + em preto. Em 0 o card volta a mostrar "Adicionar". */
export function Stepper({ productName, qty, max, onChange, qtyId }: Readonly<StepperProps>) {
  return (
    <div className="flex h-12 w-full flex-none items-center justify-between bg-brand-yellow text-expo-noite">
      <button type="button" aria-label={`Tirar 1 de ${productName}`} className={STEP_BUTTON} onClick={() => onChange(qty - 1)}>
        −
      </button>
      <span data-qty={qtyId} className="sr-only">{`${qty} no pedido`}</span>
      <span aria-hidden className="num text-[18px] font-bold">
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
