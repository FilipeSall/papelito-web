import type { ReactNode } from "react";

import { Panel } from "./panel";

export type FramedPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "warning";
};

export function FramedPanel({ children, className, tone = "default" }: FramedPanelProps) {
  return (
    <Panel className={["relative overflow-hidden", className ?? ""].join(" ")}>
      <div
        aria-hidden
        className={[
          "h-1.5 w-full shrink-0 rounded-t-[18px]",
          tone === "warning" ? "bg-[#ffe500]" : "bg-[#231f20]",
        ].join(" ")}
      />
      {children}
    </Panel>
  );
}
