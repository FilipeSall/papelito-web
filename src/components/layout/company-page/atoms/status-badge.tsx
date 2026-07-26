import { STATUS_BADGE_CLASSES, statusTone } from "@/features/company/utils/status-tone";

type StatusBadgeProps = {
  status: string | null | undefined;
  label: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block border-2 px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${
        STATUS_BADGE_CLASSES[statusTone(status)]
      } ${className ?? ""}`.trim()}
    >
      {label}
    </span>
  );
}
