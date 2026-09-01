"use client";

import { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

const generator = rough.generator();
const HEIGHT = 12;
const STROKE_Y_OFFSETS = [5.9, 7.15];
const LINE_SEED = 17;

const LINE_OPTIONS: Options = {
  bowing: 1,
  disableMultiStroke: true,
  maxRandomnessOffset: 0.75,
  roughness: 1.15,
  seed: LINE_SEED,
  strokeWidth: 1.15,
};

/**
 * Régua da prateleira desenhada à mão com rough.js.
 *
 * O traço é gerado na largura real em pixels e o viewBox acompanha essa largura.
 * Esticar um viewBox fixo quebra a conta do `stroke-dasharray` e o traço sai picotado.
 */
export function ScribbleRule({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const measure = () => setWidth(Math.round(host.getBoundingClientRect().width));

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    observer.observe(host);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const path = pathRef.current;

    if (!path || width <= 0) {
      return;
    }

    const length = path.getTotalLength();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    path.style.strokeDasharray = `${length}`;
    path.style.transitionDuration = reduced ? "0ms" : "1100ms";
    path.style.strokeDashoffset = drawn || reduced ? "0" : `${length}`;
  }, [drawn, width]);

  const d = width > 0
    ? STROKE_Y_OFFSETS.flatMap((y, index) =>
        generator
          .line(1, y, width - 1, y - 0.35, { ...LINE_OPTIONS, seed: LINE_SEED + index })
          .sets.filter((set) => set.type === "path")
          .map((set) => generator.opsToPath(set, 2)),
      ).join(" ")
    : "";

  return (
    <div aria-hidden className={className} ref={hostRef}>
      {d ? (
        <svg
          className="block h-3 w-full overflow-visible"
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          width={width}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={d}
            fill="none"
            ref={pathRef}
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth={1.15}
            style={{
              transitionProperty: "stroke-dashoffset",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </svg>
      ) : null}
    </div>
  );
}
