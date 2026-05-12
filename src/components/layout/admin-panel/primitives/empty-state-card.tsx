import { Panel } from "./panel";

export type EmptyStateCardProps = {
  body: string;
  label: string;
  title: string;
};

export function EmptyStateCard({ body, label, title }: EmptyStateCardProps) {
  return (
    <Panel tone="muted">
      <div className="flex h-full flex-col justify-between gap-6 px-5 py-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] border-2 border-dashed border-[#231f20]/28 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/46">
          {label}
        </div>
        <div>
          <h3
            className="text-xl font-semibold uppercase tracking-[0.08em]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#231f20]/68">{body}</p>
        </div>
      </div>
    </Panel>
  );
}
