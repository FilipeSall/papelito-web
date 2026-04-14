interface CartSummaryRowProps {
  label: string;
  value: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function CartSummaryRow({
  label,
  value,
  labelClassName = "text-sm text-text-tertiary",
  valueClassName = "text-sm font-medium text-brand-dark",
}: CartSummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
