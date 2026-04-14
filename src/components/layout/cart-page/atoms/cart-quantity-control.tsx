interface CartQuantityControlProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function CartQuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: CartQuantityControlProps) {
  return (
    <div className="flex h-8.5 w-24.5 items-center rounded-full border border-[#E5E7EB] bg-white px-1">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#99A1AF] transition hover:bg-[#F9FAFB] hover:text-brand-dark"
        onClick={onDecrease}
      >
        -
      </button>
      <span className="w-6 text-center text-sm font-black text-brand-dark">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[#99A1AF] transition hover:bg-[#F9FAFB] hover:text-brand-dark"
        onClick={onIncrease}
      >
        +
      </button>
    </div>
  );
}
