import type { ReactNode } from "react";

export function FigureList({ children }: { children: ReactNode }) {
  return <dl className="divide-y-2 divide-dotted divide-[#1a1a1a]/16">{children}</dl>;
}

export function FigureLine({
  label,
  note,
  tone = "default",
  value,
}: {
  label: string;
  note?: string;
  tone?: "default" | "warning";
  value: string;
}) {
  return (
    <div className="py-2.5">
      <div className="flex items-end gap-3">
        <dt className="shrink-0 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/78">
          {label}
        </dt>
        <span
          aria-hidden
          className="mb-[0.35rem] h-0 flex-1 border-b-2 border-dotted border-[#1a1a1a]/28"
        />
        <dd
          className={[
            "shrink-0 text-[1.0625rem] font-semibold tabular-nums",
            tone === "warning" ? "text-[#9d3b2f]" : "text-[#1a1a1a]",
          ].join(" ")}
          style={{ fontFamily: "var(--font-admin-mono)" }}
        >
          {value}
        </dd>
      </div>
      {note ? (
        <dd className="mt-1 text-xs leading-5 text-[#1a1a1a]/62">{note}</dd>
      ) : null}
    </div>
  );
}
