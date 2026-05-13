import type { AdminAnalyticsSeriesPoint } from "@/lib/server/admin-sales-analytics";

import { formatPercent } from "../formatters";
import { CardNotification } from "../primitives";

export function SalesDonutChart({
  label,
  notifications = [],
  points,
}: {
  label: string;
  notifications?: string[];
  points: AdminAnalyticsSeriesPoint[];
}) {
  const slices = points.length > 0 ? points.slice(0, 4) : [{ label: "sem dados", value: 100 }];
  const colors = ["#231F20", "#FFE500", "#C8C1B3", "#7D7566"];
  const total = Math.max(1, slices.reduce((sum, point) => sum + point.value, 0));

  const gradient = slices
    .reduce<{ offset: number; segments: string[] }>(
      (acc, point, index) => {
        const share = (point.value / total) * 100;
        const start = acc.offset;
        const end = acc.offset + share;

        return {
          offset: end,
          segments: [...acc.segments, `${colors[index % colors.length]} ${start}% ${end}%`],
        };
      },
      { offset: 0, segments: [] },
    )
    .segments.join(",");

  return (
    <div className="flex h-full flex-1 flex-col bg-white/75 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</p>
        <CardNotification issues={notifications} />
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-4 rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] p-4 md:flex-row md:items-center md:justify-center">
        <div
          className="animate-admin-donut-in relative h-36 w-36 rounded-full border-2 border-[#231f20]"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-5 rounded-full border-2 border-[#231f20] bg-[#fbf7ef]" />
        </div>
        <div className="space-y-3 text-sm text-[#231f20]/72">
          {slices.map((point, index) => (
            <div key={`${point.label}-${point.value}`} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span>
                {point.label} {formatPercent((point.value / total) * 100, 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
