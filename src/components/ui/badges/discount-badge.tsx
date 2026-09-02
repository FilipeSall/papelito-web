interface DiscountBadgeProps {
  discount: number;
  className?: string;
  variant?: "current" | "legacy";
}

export function DiscountBadge({ discount, className, variant = "current" }: DiscountBadgeProps) {
  if (!Number.isFinite(discount) || discount <= 0) {
    return null;
  }

  const isLegacy = variant === "legacy";

  return (
    <div
      className={`absolute right-2 top-2 flex items-center px-1.5 py-0.5 ${isLegacy ? "rounded-full bg-[#FB2C36]" : "border-2 border-brand-dark bg-[#c0392b]"} ${className ?? ""}`}
    >
      <span
        className={`whitespace-nowrap font-black leading-4 text-white ${isLegacy ? "text-xs" : "text-[0.625rem] uppercase tracking-[0.12em]"}`}
      >
        -{discount}%
      </span>
    </div>
  );
}
