import { Panel } from "../../primitives";

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
        {label}
      </span>
      <span className="text-sm leading-6 text-[#231f20]">{value || "—"}</span>
    </div>
  );
}

export function DetailSection({ title, children }: { children: React.ReactNode; title: string }) {
  return (
    <Panel className="space-y-4 p-5 md:p-6">
      <h2
        className="text-xs font-semibold uppercase tracking-[0.22em] text-[#231f20]/72"
        style={{ fontFamily: "var(--font-admin-mono)" }}
      >
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Panel>
  );
}
