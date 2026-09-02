interface CategoryBadgeProps {
  label: string;
  className?: string;
  variant?: "current" | "legacy";
}

export function CategoryBadge({ label, className, variant = "current" }: CategoryBadgeProps) {
  const isLegacy = variant === "legacy";

  return (
    <div
      className={`absolute left-2 top-2 flex items-center bg-brand-yellow px-2 py-0.5 ${isLegacy ? "rounded-full" : "border-2 border-brand-dark"} ${className ?? ""}`}
    >
      <span
        className={`whitespace-nowrap font-black leading-4 text-brand-dark ${isLegacy ? "text-xs" : "text-[0.625rem] uppercase tracking-[0.12em]"}`}
      >
        {label}
      </span>
    </div>
  );
}
