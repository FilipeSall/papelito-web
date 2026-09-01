interface DiscountBadgeProps {
  discount: number;
  className?: string;
}

export function DiscountBadge({ discount, className }: DiscountBadgeProps) {
  if (!Number.isFinite(discount) || discount <= 0) {
    return null;
  }

  return (
    <div
      className={`absolute right-2 top-2 flex items-center border-2 border-brand-dark bg-[#c0392b] px-1.5 py-0.5 ${className ?? ""}`}
    >
      <span className="whitespace-nowrap text-[0.625rem] font-black uppercase leading-4 tracking-[0.12em] text-white">
        -{discount}%
      </span>
    </div>
  );
}
