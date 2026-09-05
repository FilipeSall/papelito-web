"use client";

import { useId, useRef, useState } from "react";

import type { AdminAnalyticsSeriesPoint } from "@/lib/server/admin-sales-analytics";

import { formatCompactCurrency, formatCurrency, niceMax } from "../formatters";
import { CardNotification, HardPanel } from "../primitives";
import { SalesChartTooltip, type SalesChartTooltipAnchor } from "./sales-chart-tooltip";

type ActiveTooltip = {
  anchor: SalesChartTooltipAnchor;
  key: string;
  title: string;
  value: string;
};

export function SalesLineChart({
  emptyMessage = "Nenhum dado no período.",
  label,
  notifications = [],
  points,
}: Readonly<{
  emptyMessage?: string;
  label: string;
  notifications?: string[];
  points: AdminAnalyticsSeriesPoint[];
}>) {
  const tooltipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const hasData = points.some((point) => point.value > 0);

  if (!hasData) {
    return (
      <HardPanel accent="black" className="flex h-full flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</p>
          <CardNotification issues={notifications} />
        </div>
        <div className="mx-5 mt-5 mb-5 grid min-h-56 place-items-center rounded-xl border border-dashed border-[#231f20]/18 bg-[#f3efe4] px-5 text-center text-sm text-[#231f20]/64">
          {emptyMessage}
        </div>
      </HardPanel>
    );
  }

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

  const isSinglePoint = chartPoints.length === 1;
  const mappedPoints = chartPoints.map((point, index) => {
    const x = isSinglePoint ? paddingLeft + plotWidth / 2 : paddingLeft + step * index;
    const y = paddingTop + plotHeight - (point.value / maxValue) * plotHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = isSinglePoint
    ? `M${paddingLeft},${mappedPoints[0].y} L${paddingLeft + plotWidth},${mappedPoints[0].y}`
    : mappedPoints
        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
        .join(" ");
  const areaPath = `${linePath} L${paddingLeft + plotWidth},${paddingTop + plotHeight} L${paddingLeft},${paddingTop + plotHeight} Z`;

  function showTooltip(point: (typeof mappedPoints)[number]) {
    if (!svgRef.current) {
      return;
    }

    setActiveTooltip({
      anchor: {
        svg: svgRef.current,
        viewBoxHeight: height,
        viewBoxWidth: width,
        x: point.x,
        y: point.y,
      },
      key: `${point.key ?? point.label}-${point.value}`,
      title: point.tooltipLabel ?? point.label,
      value: formatCurrency(point.value),
    });
  }

  return (
    <HardPanel accent="black" className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#231f20]/46">{label}</p>
        <CardNotification issues={notifications} />
      </div>
      <div className="relative mx-5 mt-5 mb-5 flex flex-1 flex-col overflow-hidden rounded-xl border border-[#231f20]/12 bg-[#f3efe4] p-3">
        <svg
          className="h-full w-full flex-1"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          ref={svgRef}
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

          <path className="animate-admin-chart-fade" d={areaPath} fill="rgba(255,229,0,0.28)" />
          <path
            className="animate-admin-line-draw"
            d={linePath}
            pathLength={1}
            stroke="#231F20"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />

          {mappedPoints.map((point, index) => {
            const showLabel =
              index === 0 || index === mappedPoints.length - 1 || index % xLabelStride === 0;
            const hitWidth = Math.max(step, 28);
            const pointKey = `${point.key ?? point.label}-${point.value}`;
            const tooltipLabel = point.tooltipLabel ?? point.label;

            return (
              <g key={pointKey}>
                {showCircles ? (
                  <>
                    <circle
                      className="animate-admin-point-pop"
                      cx={point.x}
                      cy={point.y}
                      fill="#FFE500"
                      r="5"
                      stroke="#231F20"
                      strokeWidth="2"
                      style={{ animationDelay: `${800 + index * 32}ms` }}
                    />
                    <circle
                      aria-describedby={activeTooltip?.key === pointKey ? tooltipId : undefined}
                      aria-label={`${tooltipLabel}: ${formatCurrency(point.value)}`}
                      cx={point.x}
                      cy={point.y}
                      fill="transparent"
                      onBlur={() => setActiveTooltip(null)}
                      onFocus={() => showTooltip(point)}
                      onPointerDown={() => showTooltip(point)}
                      onPointerEnter={() => showTooltip(point)}
                      onPointerLeave={() => setActiveTooltip(null)}
                      pointerEvents="all"
                      r="10"
                      role="button"
                      stroke="transparent"
                      tabIndex={0}
                    />
                  </>
                ) : null}
                {!showCircles ? (
                  <rect
                    aria-describedby={activeTooltip?.key === pointKey ? tooltipId : undefined}
                    aria-label={`${tooltipLabel}: ${formatCurrency(point.value)}`}
                    fill="transparent"
                    height={plotHeight + 12}
                    onBlur={() => setActiveTooltip(null)}
                    onFocus={() => showTooltip(point)}
                    onPointerDown={() => showTooltip(point)}
                    onPointerEnter={() => showTooltip(point)}
                    onPointerLeave={() => setActiveTooltip(null)}
                    role="button"
                    tabIndex={0}
                    width={hitWidth}
                    x={point.x - hitWidth / 2}
                    y={paddingTop - 6}
                  />
                ) : null}
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
        <SalesChartTooltip
          anchor={activeTooltip?.anchor ?? null}
          id={tooltipId}
          title={activeTooltip?.title ?? ""}
          value={activeTooltip?.value ?? ""}
        />
      </div>
    </HardPanel>
  );
}
