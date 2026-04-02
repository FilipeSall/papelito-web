import { CartIcon } from "./icons";

interface AddToCartButtonProps {
  label?: string;
  onClick?: () => void;
}

export function AddToCartButton({ label, onClick }: AddToCartButtonProps) {
  if (label) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Adicionar ao carrinho"
        className="flex items-center justify-center gap-1.5 w-full h-7 bg-brand-dark rounded-[10px] hover:opacity-80 transition-opacity"
      >
        <CartIcon className="size-3 text-white" />
        <span className="font-black text-xs leading-4 text-white">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar ao carrinho"
      className="flex items-center justify-center w-9 h-9 bg-brand-dark rounded-[14px] shrink-0 hover:opacity-80 transition-opacity"
    >
      <CartIcon className="size-4 text-white" />
    </button>
  );
}
