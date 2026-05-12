import type { AdminAnalyticsSeriesPoint } from "@/lib/server/admin-sales-analytics";

import { formatCompactCurrency, niceMax } from "../formatters";
import { CardNotification } from "../primitives";

export function SalesLineChart({
  label,
  notifications = [],
  points,
}: {
  label: string;
  notifications?: string[];
  points: AdminAnalyticsSeriesPoint[];
}) {
  const chartPoints = points.length > 0 ? points : [{ label: "sem dados", value: 0 }];
  const width = 640;
  const height = 280;
  const paddingTop = 18;
  const paddingRight = 18;
  const paddingBottom = 38;
  const paddingLeft = 66;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const step =
    chartPoints.length > 1 ? plotWidth / (chartPoints.length - 1) : plotWidth;
  const rawMax = Math.max(1, ...chartPoints.map((point) => point.value));
  const maxValue = niceMax(rawMax);
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => (maxValue / tickCount) * i);
  const xLabelStride = Math.max(1, Math.ceil(chartPoints.length / 6));
  const showCircles = chartPoints.length <= 40;

  const mappedPoints = chartPoints.map((point, index) => {
    const x = paddingLeft + step * index;
    const y = paddingTop + plotHeight - (point.value / maxValue) * plotHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = mappedPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L${paddingLeft + plotWidth},${paddingTop + plotHeight} L${paddingLeft},${paddingTop + plotHeight} Z`;

  return (
    <div className="flex h-full flex-1 flex-col bg-white/75 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</p>
        <CardNotification issues={notifications} />
      </div>
      <div className="relative mt-5 flex flex-1 flex-col overflow-hidden rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] p-3">
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
                  {formatCompactCurrency(value)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="rgba(255,229,0,0.28)" />
          <path d={linePath} stroke="#231F20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />

          {mappedPoints.map((point, index) => {
            const showLabel =
              index === 0 || index === mappedPoints.length - 1 || index % xLabelStride === 0;
            const hitWidth = Math.max(step, 28);

            return (
              <g key={`${point.label}-${point.value}`} className="group">
                <rect
                  fill="transparent"
                  height={plotHeight + 12}
                  width={hitWidth}
                  x={point.x - hitWidth / 2}
                  y={paddingTop - 6}
                />
                {showCircles ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="#FFE500"
                    r="5"
                    stroke="#231F20"
                    strokeWidth="2"
                  />
                ) : null}
                <text
                  className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  fill="#231f20"
                  fillOpacity="0.88"
                  fontFamily="var(--font-admin-mono)"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  x={point.x}
                  y={point.y - 12}
                >
                  {formatCompactCurrency(point.value)}
                </text>
                {showLabel ? (
                  <text
                    fill="#231f20"
                    fillOpacity="0.6"
                    fontFamily="var(--font-admin-mono)"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    x={point.x}
                    y={paddingTop + plotHeight + 20}
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
