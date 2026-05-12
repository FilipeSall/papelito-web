import { Panel } from "./panel";

export type MetricCardProps = {
  detail: string;
  label: string;
  tone?: "default" | "warning";
  value: string;
};

export function MetricCard({ detail, label, tone = "default", value }: MetricCardProps) {
  return (
    <Panel className="relative z-30 overflow-hidden">
      <div
        className={[
          "h-1.5 w-full rounded-t-[18px]",
          tone === "warning" ? "bg-[#ffe500]" : "bg-[#231f20]",
        ].join(" ")}
      />
      <div className="px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/44">
          {label}
        </p>
        <p
          className="mt-3 text-[2rem] font-semibold uppercase leading-none tracking-[0.06em]"
          style={{ fontFamily: "var(--font-admin-display)" }}
        >
          {value}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#231f20]/68">{detail}</p>
      </div>
    </Panel>
  );
}
