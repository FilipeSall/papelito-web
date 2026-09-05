"use client";

import { createPortal } from "react-dom";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";

const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 12;
const CARET_MARGIN = 14;

export type SalesChartTooltipAnchor = {
  svg: SVGSVGElement;
  viewBoxHeight: number;
  viewBoxWidth: number;
  x: number;
  y: number;
};

type TooltipSize = {
  height: number;
  width: number;
};

type ViewportSize = {
  height: number;
  width: number;
};

export type SalesChartTooltipPosition = {
  caretLeft: number;
  left: number;
  placement: "above" | "below";
  top: number;
};

export function calculateSalesChartTooltipPosition({
  anchor,
  tooltip,
  viewport,
}: {
  anchor: { x: number; y: number };
  tooltip: TooltipSize;
  viewport: ViewportSize;
}): SalesChartTooltipPosition {
  const maxLeft = Math.max(VIEWPORT_MARGIN, viewport.width - tooltip.width - VIEWPORT_MARGIN);
  const left = Math.min(
    Math.max(anchor.x - tooltip.width / 2, VIEWPORT_MARGIN),
    maxLeft,
  );
  const canPlaceAbove = anchor.y - ANCHOR_GAP - tooltip.height >= VIEWPORT_MARGIN;
  const canPlaceBelow = anchor.y + ANCHOR_GAP + tooltip.height <= viewport.height - VIEWPORT_MARGIN;
  const placement = canPlaceAbove || !canPlaceBelow ? "above" : "below";
  const preferredTop = placement === "above" ? anchor.y - tooltip.height - ANCHOR_GAP : anchor.y + ANCHOR_GAP;
  const maxTop = Math.max(VIEWPORT_MARGIN, viewport.height - tooltip.height - VIEWPORT_MARGIN);
  const top = Math.min(Math.max(preferredTop, VIEWPORT_MARGIN), maxTop);
  const caretLeft = Math.min(
    Math.max(anchor.x - left, CARET_MARGIN),
    Math.max(CARET_MARGIN, tooltip.width - CARET_MARGIN),
  );

  return { caretLeft, left, placement, top };
}

function getSvgViewportPoint(anchor: SalesChartTooltipAnchor) {
  const rect = anchor.svg.getBoundingClientRect();
  const scale = Math.min(
    rect.width / anchor.viewBoxWidth,
    rect.height / anchor.viewBoxHeight,
  );
  const renderedWidth = anchor.viewBoxWidth * scale;
  const renderedHeight = anchor.viewBoxHeight * scale;

  return {
    x: rect.left + (rect.width - renderedWidth) / 2 + anchor.x * scale,
    y: rect.top + (rect.height - renderedHeight) / 2 + anchor.y * scale,
  };
}

export function SalesChartTooltip({
  anchor,
  detail,
  id,
  title,
  value,
}: Readonly<{
  anchor: SalesChartTooltipAnchor | null;
  detail?: string;
  id?: string;
  title: string;
  value: string;
}>) {
  const generatedId = useId();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<SalesChartTooltipPosition | null>(null);

  const recalculatePosition = useCallback(() => {
    if (!anchor || !tooltipRef.current) {
      return;
    }

    const point = getSvgViewportPoint(anchor);
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const nextPosition = calculateSalesChartTooltipPosition({
      anchor: point,
      tooltip: { height: tooltipRect.height, width: tooltipRect.width },
      viewport: { height: window.innerHeight, width: window.innerWidth },
    });

    setPosition(nextPosition);
  }, [anchor]);

  useLayoutEffect(() => {
    if (!anchor) {
      return;
    }

    recalculatePosition();

    const handleViewportChange = () => recalculatePosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(handleViewportChange);
    resizeObserver?.observe(anchor.svg);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      resizeObserver?.disconnect();
    };
  }, [anchor, recalculatePosition]);

  if (!anchor || typeof document === "undefined") {
    return null;
  }

  const tooltipId = id ?? generatedId;

  return createPortal(
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className="pointer-events-none fixed z-[100] min-w-32 border border-[#1a1a1a]/24 bg-white px-4 py-3 text-center text-[#1a1a1a] shadow-[3px_3px_0_rgba(35,31,32,0.18)]"
      style={{
        left: position?.left ?? 0,
        opacity: position ? 1 : 0,
        top: position?.top ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {position ? (
        <span
          aria-hidden="true"
          className={
            position.placement === "above"
              ? "absolute top-full -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent border-t-white"
              : "absolute bottom-full -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent border-b-white"
          }
          style={{ left: position.caretLeft }}
        />
      ) : null}
      <p className="text-[11px] font-black leading-4 tracking-[0.04em]">{title}</p>
      <p className="mt-1 text-sm font-bold leading-5" data-numeric="true">
        {value}
      </p>
      {detail ? <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]/56">{detail}</p> : null}
    </div>,
    document.body,
  );
}
