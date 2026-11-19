type QuickQtyProps = {
  productName: string;
  qty: number;
  max: number;
  onSet: (qty: number) => void;
  tall?: boolean;
};

const OPTIONS = [5, 10, 20];

/** Botões 5/10/20 un. que DEFINEM a quantidade (não somam). O valor atual fica preto. */
export function QuickQty({ productName, qty, max, onSet, tall = false }: Readonly<QuickQtyProps>) {
  const layout = tall ? "flex gap-3" : "grid grid-cols-3 gap-1.5";
  const size = tall ? "h-14 px-4 border-expo-ink text-base font-extrabold" : "h-11 text-sm font-medium";

  return (
    <div className={layout} role="group" aria-label={`Quantidade rápida de ${productName}`}>
      {OPTIONS.map((option) => {
        const pressed = qty === option;
        const tone = pressed
          ? "border-expo-noite bg-expo-noite text-white"
          : tall
            ? "bg-white text-expo-ink"
            : "border-expo-chip bg-white text-expo-zinc";
        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            aria-label={`Colocar ${option} de ${productName} no pedido`}
            disabled={option > max}
            onClick={() => onSet(option)}
            className={`num border ${size} ${tone} disabled:opacity-40`}
          >
            {`${option} un.`}
          </button>
        );
      })}
    </div>
  );
}
