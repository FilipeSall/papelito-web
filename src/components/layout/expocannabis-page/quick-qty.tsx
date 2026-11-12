type QuickQtyProps = {
  productName: string;
  qty: number;
  max: number;
  onSet: (qty: number) => void;
  tall?: boolean;
};

const OPTIONS = [5, 10, 20];

/** Botões 5/10/20 un. que definem a quantidade (não somam). O valor atual fica preto com texto amarelo. */
export function QuickQty({ productName, qty, max, onSet, tall = false }: Readonly<QuickQtyProps>) {
  const layout = tall ? "flex gap-2" : "grid grid-cols-3 gap-1.5";
  const size = tall ? "h-14 px-4 text-base" : "h-11 text-[15px]";

  return (
    <div className={layout}>
      {OPTIONS.map((option) => {
        const pressed = qty === option;
        const tone = pressed ? "border-[#231F20] bg-[#231F20] text-brand-yellow" : "border-[#D4D4D8] bg-white";
        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            aria-label={`Colocar ${option} de ${productName} no pedido`}
            disabled={option > max}
            onClick={() => onSet(option)}
            className={`${size} ${tone} rounded-md border-[1.5px] font-extrabold transition-transform duration-120 active:scale-94 disabled:opacity-30 motion-reduce:transition-none`}
          >
            {`${option} un.`}
          </button>
        );
      })}
    </div>
  );
}
