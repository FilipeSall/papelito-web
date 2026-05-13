import type { AdminAnalyticsSeriesPoint } from "@/lib/server/admin-sales-analytics";

import { formatCompactNumber, niceMax } from "../formatters";
import { CardNotification, FramedPanel } from "../primitives";

export function SalesBarsChart({
  label,
  notifications = [],
  points,
}: {
  label: string;
  notifications?: string[];
  points: AdminAnalyticsSeriesPoint[];
}) {
  const bars = points.length > 0 ? points.slice(0, 6) : [{ label: "sem dados", value: 0 }];
  const width = 640;
  const height = 280;
  const paddingTop = 24;
  const paddingRight = 18;
  const paddingBottom = 34;
  const paddingLeft = 56;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const rawMax = Math.max(1, ...bars.map((point) => point.value));
  const maxValue = niceMax(rawMax);
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);
  const MAX_GROUP_WIDTH = 110;
  const usedPlotWidth = Math.min(plotWidth, MAX_GROUP_WIDTH * bars.length);
  const plotXOffset = paddingLeft + (plotWidth - usedPlotWidth) / 2;
  const groupWidth = usedPlotWidth / bars.length;
  const barWidth = Math.min(72, groupWidth * 0.72);

  return (
    <FramedPanel className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</p>
        <CardNotification issues={notifications} />
      </div>
      <div className="mx-5 mt-5 mb-5 flex flex-1 flex-col overflow-hidden rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] p-2">
        <svg
          className="h-full w-full flex-1"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${width} ${height}`}
        >
          {yTicks.map((value, index) => {
            const y = paddingTop + plotHeight - (value / maxValue) * plotHeight;
            const isBaseline = index === 0;

            return (
              <g key={`y-${value}`}>
                <line
                  stroke="#231f20"
                  strokeDasharray={isBaseline ? "0" : "3 4"}
                  strokeOpacity={isBaseline ? 0.38 : 0.12}
                  strokeWidth="1"
                  x1={paddingLeft}
                  x2={paddingLeft + plotWidth}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#231f20"
                  fillOpacity="0.62"
                  fontFamily="var(--font-admin-mono)"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="end"
                  x={paddingLeft - 10}
                  y={y + 4}
                >
                  {formatCompactNumber(value)}
                </text>
              </g>
            );
          })}

          {bars.map((point, index) => {
            const groupX = plotXOffset + groupWidth * index;
            const barX = groupX + (groupWidth - barWidth) / 2;
            const barHeight = (point.value / maxValue) * plotHeight;
            const barY = paddingTop + plotHeight - barHeight;
            const fill = index % 2 === 0 ? "#231F20" : "#FFE500";

            return (
              <g key={`${point.label}-${point.value}`}>
                <rect
                  className="animate-admin-bar-rise"
                  fill={fill}
                  height={Math.max(barHeight, 2)}
                  rx="6"
                  stroke="#231F20"
                  strokeWidth="2"
                  style={{ animationDelay: `${180 + index * 105}ms` }}
                  width={barWidth}
                  x={barX}
                  y={barY}
                />
                <text
                  fill="#231f20"
                  fillOpacity="0.88"
                  fontFamily="var(--font-admin-mono)"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  x={groupX + groupWidth / 2}
                  y={barY - 8}
                >
                  {formatCompactNumber(point.value)}
                </text>
                <text
                  fill="#231f20"
                  fillOpacity="0.6"
                  fontFamily="var(--font-admin-mono)"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  x={groupX + groupWidth / 2}
                  y={paddingTop + plotHeight + 20}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </FramedPanel>
  );
}
