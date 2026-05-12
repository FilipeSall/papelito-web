export type PanelProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "muted" | "dark";
};

function panelClassName(tone: PanelProps["tone"], className?: string) {
  const toneClassName =
    tone === "dark"
      ? "bg-[#231f20] text-[#f5f1e8]"
      : tone === "muted"
        ? "bg-[#f7f2e7] text-[#231f20]"
        : "bg-[#fbf7ef] text-[#231f20]";

  return [
    "rounded-[20px] border-2 border-[#231f20] shadow-[8px_8px_0_rgba(35,31,32,0.08)]",
    toneClassName,
    className ?? "",
  ].join(" ");
}

export function Panel({ children, className, tone = "default" }: PanelProps) {
  return <section className={panelClassName(tone, className)}>{children}</section>;
}
