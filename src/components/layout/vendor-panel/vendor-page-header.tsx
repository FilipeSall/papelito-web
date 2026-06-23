import type { ReactNode } from "react";

import { Panel, StatusBadge } from "@/components/layout/operational-panel";

export function VendorPageHeader({
  action,
  description,
  eyebrow,
  signal,
  title,
}: {
  action?: ReactNode;
  description: string;
  eyebrow: string;
  signal?: string;
  title: string;
}) {
  return (
    <Panel className="animate-admin-panel-enter overflow-hidden rounded-none border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div className="border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-brand-yellow md:px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.26em]">{eyebrow}</p>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-end md:justify-between md:px-6 md:py-6">
        <div className="max-w-3xl">
          <h2
            className="text-2xl font-black uppercase tracking-widest md:text-3xl"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#1a1a1a]/68">{description}</p>
        </div>
        {action ?? (
          signal ? (
            <StatusBadge
              className="rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-3 py-1 text-[10px] font-black tracking-[0.18em] text-brand-yellow"
              label={signal}
            />
          ) : null
        )}
      </div>
    </Panel>
  );
}
