import { getStockLabel } from "@/features/active-vendor";

interface VendorStockBadgeProps {
  qty: number;
  className?: string;
}

const TONE_CLASSES: Record<"ok" | "warning" | "critical", string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

export function VendorStockBadge({ qty, className }: VendorStockBadgeProps) {
  const label = getStockLabel(qty);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASSES[label.tone]}${className ? ` ${className}` : ""}`}
    >
      {label.text}
    </span>
  );
}
