import { Panel, StatusBadge } from "@/components/layout/operational-panel";

export function VendorPageHeader({
  description,
  eyebrow,
  signal,
  title,
}: {
  description: string;
  eyebrow: string;
  signal?: string;
  title: string;
}) {
  return (
    <Panel className="animate-admin-panel-enter overflow-hidden">
      <div className="border-b border-brand-dark/10 bg-brand-dark px-5 py-3 text-brand-yellow">
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em]">{eyebrow}</p>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6">
        <div className="max-w-3xl">
          <h2
            className="text-2xl font-semibold uppercase tracking-[0.1em] md:text-3xl"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-brand-dark/68">{description}</p>
        </div>
        {signal ? <StatusBadge label={signal} /> : null}
      </div>
    </Panel>
  );
}
