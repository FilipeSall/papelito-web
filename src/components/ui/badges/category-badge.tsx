interface CategoryBadgeProps {
  label: string;
  className?: string;
}

export function CategoryBadge({ label, className }: CategoryBadgeProps) {
  return (
    <div
      className={`absolute top-2 left-2 flex items-center px-2 py-0.5 bg-brand-yellow rounded-full ${className ?? ""}`}
    >
      <span className="font-black text-xs leading-4 text-brand-dark whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
