type StepperProps = {
  productName: string;
  qty: number;
  max: number;
  onChange: (qty: number) => void;
  size?: "md" | "sm";
  qtyId?: number;
};

/** Contador escuro −/+ de um produto. Em 0 o card volta a mostrar "Adicionar". */
export function Stepper({ productName, qty, max, onChange, size = "md", qtyId }: Readonly<StepperProps>) {
  const box = size === "md" ? "h-11 w-11" : "h-10 w-10";
  return (
    <div className="flex items-center justify-between rounded-md bg-[#231F20] text-white">
      <button type="button" aria-label={`Tirar 1 de ${productName}`} className={`${box} text-2xl font-bold`} onClick={() => onChange(qty - 1)}>
        −
      </button>
      <span data-qty={qtyId} className="sr-only">{`${qty} no pedido`}</span>
      <span aria-hidden key={qty} className="expo-pop text-lg font-extrabold">
        {qty}
      </span>
      <button
        type="button"
        aria-label={`Colocar 1 de ${productName}`}
        className={`${box} text-2xl font-bold disabled:opacity-30`}
        disabled={qty >= max}
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
