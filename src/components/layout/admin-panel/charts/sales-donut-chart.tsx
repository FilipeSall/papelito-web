"use client";

import { useId, useRef, useState } from "react";

import type { AdminAnalyticsSeriesPoint } from "@/lib/server/admin-sales-analytics";

import { formatCompactNumber, formatPercent } from "../formatters";
import { CardNotification, HardPanel } from "../primitives";
import { SalesChartTooltip, type SalesChartTooltipAnchor } from "./sales-chart-tooltip";

type DonutSegment = AdminAnalyticsSeriesPoint & {
  end: number;
  share: number;
  start: number;
};

type ActiveTooltip = {
  anchor: SalesChartTooltipAnchor;
  detail: string;
  key: string;
  title: string;
  value: string;
};

export function SalesDonutChart({
  label,
  notifications = [],
  points,
}: {
  label: string;
  notifications?: string[];
  points: AdminAnalyticsSeriesPoint[];
}) {
  const tooltipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const slices = points.length > 0 ? points.slice(0, 4) : [{ label: "sem dados", value: 100 }];
  const colors = ["#231F20", "#FFE500", "#C8C1B3", "#7D7566"];
  const total = Math.max(1, slices.reduce((sum, point) => sum + point.value, 0));
  const donutSize = 160;
  const donutCenter = donutSize / 2;
  const donutRadius = 66;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const segments = slices.reduce<DonutSegment[]>((result, point) => {
    const start = result.at(-1)?.end ?? 0;
    const share = (point.value / total) * 100;

    return [...result, { ...point, end: start + share, share, start }];
  }, []);

  function showTooltip(segment: DonutSegment) {
    if (!svgRef.current || segment.share <= 0) {
      return;
    }

    const midpointAngle = ((segment.start + segment.share / 2) / 100) * Math.PI * 2 - Math.PI / 2;
    setActiveTooltip({
      anchor: {
        svg: svgRef.current,
        viewBoxHeight: donutSize,
        viewBoxWidth: donutSize,
        x: donutCenter + donutRadius * Math.cos(midpointAngle),
        y: donutCenter + donutRadius * Math.sin(midpointAngle),
      },
      detail: formatPercent((segment.value / total) * 100, 0),
      key: `${segment.label}-${segment.value}`,
      title: segment.tooltipLabel ?? segment.label,
      value: formatCompactNumber(segment.value),
    });
  }

  return (
    <HardPanel accent="black" className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</p>
        <CardNotification issues={notifications} />
      </div>
      <div className="mx-5 mt-5 mb-5 flex flex-1 flex-col gap-4 rounded-[16px] border border-[#231f20]/12 bg-[#f3efe4] p-4 md:flex-row md:items-center md:justify-center">
        <svg
          aria-label="Distribuição por método de pagamento"
          className="animate-admin-donut-in h-36 w-36 shrink-0 overflow-visible"
          fill="none"
          ref={svgRef}
          viewBox={`0 0 ${donutSize} ${donutSize}`}
        >
          {segments.every((segment) => segment.share <= 0) ? (
            <circle
              cx={donutCenter}
              cy={donutCenter}
              fill="none"
              r={donutRadius}
              stroke="#C8C1B3"
              strokeWidth="28"
            />
          ) : null}
          {segments.map((segment, index) => {
            if (segment.share <= 0) {
              return null;
            }

            const dashLength = (segment.share / 100) * donutCircumference;
            const dashOffset = -(segment.start / 100) * donutCircumference;
            const segmentKey = `${segment.label}-${segment.value}`;

            return (
              <g key={segmentKey}>
                <circle
                  cx={donutCenter}
                  cy={donutCenter}
                  fill="none"
                  r={donutRadius}
                  stroke={colors[index % colors.length]}
                  strokeDasharray={`${dashLength} ${donutCircumference}`}
                  strokeDashoffset={dashOffset}
                  strokeWidth="28"
                  transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
                />
                <circle
                  aria-describedby={activeTooltip?.key === segmentKey ? tooltipId : undefined}
                  aria-label={`${segment.tooltipLabel ?? segment.label}: ${formatCompactNumber(segment.value)}, ${formatPercent((segment.value / total) * 100, 0)}`}
                  cx={donutCenter}
                  cy={donutCenter}
                  fill="none"
                  onBlur={() => setActiveTooltip(null)}
                  onFocus={() => showTooltip(segment)}
                  onPointerDown={() => showTooltip(segment)}
                  onPointerEnter={() => showTooltip(segment)}
                  onPointerLeave={() => setActiveTooltip(null)}
                  r={donutRadius}
                  role="button"
                  stroke="transparent"
                  strokeDasharray={`${dashLength} ${donutCircumference}`}
                  strokeDashoffset={dashOffset}
                  strokeWidth="28"
                  tabIndex={0}
                  transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
                />
              </g>
            );
          })}
          <circle
            cx={donutCenter}
            cy={donutCenter}
            fill="#fbf7ef"
            r="50"
            stroke="#231f20"
            strokeWidth="2"
          />
        </svg>
        <div className="space-y-3 text-sm text-[#231f20]/72">
          {segments.map((segment, index) => (
            <div
              key={`${segment.label}-${segment.value}`}
              className="flex items-center gap-3"
              onMouseEnter={() => showTooltip(segment)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span>
                {segment.label} {formatPercent((segment.value / total) * 100, 0)}
              </span>
            </div>
          ))}
        </div>
        <SalesChartTooltip
          anchor={activeTooltip?.anchor ?? null}
          detail={activeTooltip?.detail}
          id={tooltipId}
          title={activeTooltip?.title ?? ""}
          value={activeTooltip?.value ?? ""}
        />
      </div>
    </HardPanel>
  );
}
