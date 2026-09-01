interface CategoryBadgeProps {
  label: string;
  className?: string;
}

export function CategoryBadge({ label, className }: CategoryBadgeProps) {
  return (
    <div
      className={`absolute left-2 top-2 flex items-center border-2 border-brand-dark bg-brand-yellow px-2 py-0.5 ${className ?? ""}`}
    >
      <span className="whitespace-nowrap text-[0.625rem] font-black uppercase leading-4 tracking-[0.12em] text-brand-dark">
        {label}
      </span>
    </div>
  );
}
