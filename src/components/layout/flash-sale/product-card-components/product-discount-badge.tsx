interface ProductDiscountBadgeProps {
  discount: number;
}

/**
 * Badge atômico de desconto percentual.
 *
 * Pill vermelha com texto branco exibindo o valor do desconto
 * (ex: "-20%"). Posicionado no canto superior direito do card.
 */
export function ProductDiscountBadge({
  discount,
}: ProductDiscountBadgeProps) {
  return (
    <div className="absolute top-2 right-2 flex items-center px-2 py-0.5 bg-[#FB2C36] rounded-full">
      <span className="font-black text-xs leading-4 text-white whitespace-nowrap">
        -{discount}%
      </span>
    </div>
  );
}
