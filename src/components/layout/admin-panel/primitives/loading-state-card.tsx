import { Panel } from "./panel";

export function LoadingStateCard() {
  return (
    <Panel>
      <div className="border-b border-[#231f20]/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
          loading state
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="h-4 w-28 animate-pulse rounded-full bg-[#231f20]/12" />
        <div className="space-y-3">
          <div className="h-10 animate-pulse rounded-[14px] bg-[#231f20]/10" />
          <div className="h-10 animate-pulse rounded-[14px] bg-[#231f20]/8" />
          <div className="h-20 animate-pulse rounded-[18px] bg-[#231f20]/12" />
        </div>
        <p className="text-sm leading-6 text-[#231f20]/64">
          Estado visual para sincronizacao de analytics, imports e preloads do painel.
        </p>
      </div>
    </Panel>
  );
}
