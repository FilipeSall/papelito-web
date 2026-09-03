import type { LucideIcon } from "lucide-react";

export type StatusTone = "neutral" | "positive" | "pending" | "critical";

export type StatusShape = {
  icon: LucideIcon;
  label: string;
  tone: StatusTone;
};

const TONE_CLASS: Record<StatusTone, string> = {
  critical: "border-[#c0392b] bg-[#c0392b] text-white",
  neutral: "border-[#1a1a1a] bg-white text-[#1a1a1a]",
  pending: "border-[#1a1a1a] bg-[#faf8f2] text-[#1a1a1a]",
  positive: "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]",
};

/**
 * Status sempre como ícone **mais** texto.
 *
 * A cor é reforço, nunca o portador do significado: o rótulo continua legível sem cor, em preto e
 * branco e para quem não distingue as cores da marca.
 */
export function StatusChip({
  className,
  compact = false,
  icon: Icon,
  label,
  tone,
}: {
  className?: string;
  compact?: boolean;
  icon: LucideIcon;
  label: string;
  tone: StatusTone;
}) {
  return (
    <span
      className={[
        "inline-flex min-h-7 items-center gap-1.5 border-2 px-2.5 py-1 font-black uppercase tracking-[0.14em]",
        compact ? "text-[9px]" : "text-[10px]",
        TONE_CLASS[tone],
        className ?? "",
      ].join(" ")}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
      {label}
    </span>
  );
}
