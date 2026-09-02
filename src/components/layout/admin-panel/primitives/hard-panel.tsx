import type { ReactNode } from "react";

export type HardPanelProps = {
  accent?: "black" | "none" | "yellow";
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "dark" | "default" | "muted";
};

const TONE_CLASS: Record<NonNullable<HardPanelProps["tone"]>, string> = {
  dark: "bg-[#1a1a1a] text-[#f5f1e8]",
  default: "bg-[#fbf7ef] text-[#1a1a1a]",
  muted: "bg-[#f7f2e7] text-[#1a1a1a]",
};

const ACCENT_CLASS: Record<Exclude<NonNullable<HardPanelProps["accent"]>, "none">, string> = {
  black: "bg-[#1a1a1a]",
  yellow: "bg-brand-yellow",
};

export function HardPanel({
  accent = "none",
  children,
  className,
  id,
  tone = "default",
}: HardPanelProps) {
  return (
    <section
      id={id}
      className={[
        "relative rounded-none border-2 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a]",
        TONE_CLASS[tone],
        className ?? "",
      ].join(" ")}
    >
      {accent === "none" ? null : (
        <div aria-hidden className={["h-2 w-full shrink-0", ACCENT_CLASS[accent]].join(" ")} />
      )}
      {children}
    </section>
  );
}
