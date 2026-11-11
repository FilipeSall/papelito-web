type QuickQtyProps = {
  productName: string;
  qty: number;
  max: number;
  onSet: (qty: number) => void;
  tall?: boolean;
};

const OPTIONS = [5, 10, 20];

/** Botões 5/10/20 que definem a quantidade (não somam). O valor atual fica marcado. */
export function QuickQty({ productName, qty, max, onSet, tall = false }: Readonly<QuickQtyProps>) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const pressed = qty === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            aria-label={`Colocar ${option} de ${productName} no pedido`}
            disabled={option > max}
            onClick={() => onSet(option)}
            className={`${tall ? "h-14" : "h-11"} rounded-md border-2 text-base font-extrabold disabled:opacity-30 ${pressed ? "border-[#231F20] bg-[#231F20] text-brand-yellow" : "border-[#D4D4D8] bg-white"}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
