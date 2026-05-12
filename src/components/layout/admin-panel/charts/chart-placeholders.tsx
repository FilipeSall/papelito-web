import { StatusBadge } from "../primitives";

export function LineChartPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-[18px] border border-[#231f20]/12 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
          {label}
        </p>
        <StatusBadge label="chart.js slot" />
      </div>
      <div className="relative mt-5 h-52 overflow-hidden rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: [
              "linear-gradient(to right, rgba(35,31,32,0.08) 1px, transparent 1px)",
              "linear-gradient(to bottom, rgba(35,31,32,0.08) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "48px 100%, 100% 36px",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 600 240">
          <path
            d="M20 188C83 172 112 98 171 116C233 136 257 44 328 68C396 90 420 186 478 174C526 165 547 116 580 92"
            stroke="#231F20"
            strokeLinecap="square"
            strokeWidth="4"
          />
          <path
            d="M20 188C83 172 112 98 171 116C233 136 257 44 328 68C396 90 420 186 478 174C526 165 547 116 580 92"
            stroke="#FFE500"
            strokeDasharray="8 10"
            strokeLinecap="square"
            strokeWidth="10"
          />
        </svg>
      </div>
    </div>
  );
}

export function BarChartPlaceholder({ label }: { label: string }) {
  const bars = [62, 84, 45, 98, 54, 76, 39];

  return (
    <div className="rounded-[18px] border border-[#231f20]/12 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
          {label}
        </p>
        <StatusBadge label="status mix" />
      </div>
      <div className="mt-5 flex h-52 items-end gap-3 rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] px-4 py-4">
        {bars.map((height, index) => (
          <div key={height} className="flex flex-1 flex-col justify-end gap-2">
            <div
              className={[
                "rounded-t-[10px] border border-[#231f20]",
                index % 2 === 0 ? "bg-[#231f20]" : "bg-[#ffe500]",
              ].join(" ")}
              style={{ height: `${height}%` }}
            />
            <span
              className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#231f20]/44"
              style={{ fontFamily: "var(--font-admin-mono)" }}
            >
              d{index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChartPlaceholder() {
  return (
    <div className="rounded-[18px] border border-[#231f20]/12 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">
          mix / concentracao
        </p>
        <StatusBadge label="doughnut" />
      </div>
      <div className="mt-5 flex items-center gap-6 rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] p-4">
        <div className="relative h-36 w-36 rounded-full border-2 border-[#231f20] bg-[conic-gradient(#231f20_0_38%,#ffe500_38%_67%,#c8c1b3_67%_100%)]">
          <div className="absolute inset-5 rounded-full border-2 border-[#231f20] bg-[#fbf7ef]" />
        </div>
        <div className="space-y-3 text-sm text-[#231f20]/72">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#231f20]" />
            linha premium 38%
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#ffe500]" />
            linha core 29%
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#c8c1b3]" />
            cauda longa 33%
          </div>
        </div>
      </div>
    </div>
  );
}
