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
      className={`absolute top-2 right-2 flex items-center px-1.5 py-0.5 bg-[#FB2C36] rounded-full ${className ?? ""}`}
    >
      <span className="font-black text-xs leading-4 text-white whitespace-nowrap">
        -{discount}%
      </span>
    </div>
  );
}
