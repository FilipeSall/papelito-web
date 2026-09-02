"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

const generator = rough.generator();
const HEIGHT = 12;
const STROKE_Y_OFFSETS = [5.9, 7.15];
const STROKE_X_OFFSETS = [5.9, 7.15];
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
interface ScribbleRuleProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function ScribbleRule({ className, orientation = "horizontal" }: ScribbleRuleProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const drawnRef = useRef(false);
  const [length, setLength] = useState(0);

  /* O risco é estado do DOM, não do React: guardá-lo em `useState` só serviria
     para disparar um render que reescreve o mesmo atributo de estilo. */
  const paintStroke = useCallback(() => {
    const path = pathRef.current;

    if (!path) {
      return;
    }

    const pathLength = path.getTotalLength();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    path.style.strokeDasharray = `${pathLength}`;
    path.style.transitionDuration = reduced ? "0ms" : "1100ms";
    path.style.strokeDashoffset = drawnRef.current || reduced ? "0" : `${pathLength}`;
  }, []);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const measure = () => {
      const bounds = host.getBoundingClientRect();

      setLength(Math.round(orientation === "horizontal" ? bounds.width : bounds.height));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(measure);

    observer.observe(host);

    return () => observer.disconnect();
  }, [orientation]);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const draw = () => {
      drawnRef.current = true;
      paintStroke();
    };

    if (typeof IntersectionObserver === "undefined") {
      draw();

      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          draw();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );

    observer.observe(host);

    return () => observer.disconnect();
  }, [paintStroke]);

  useEffect(() => {
    if (length <= 0) {
      return;
    }

    paintStroke();
  }, [length, paintStroke]);

  const d = length > 0
    ? (orientation === "horizontal" ? STROKE_Y_OFFSETS : STROKE_X_OFFSETS)
        .flatMap((offset, index) => {
          const drawable = orientation === "horizontal"
            ? generator.line(1, offset, length - 1, offset - 0.35, {
                ...LINE_OPTIONS,
                seed: LINE_SEED + index,
              })
            : generator.line(offset, 1, offset - 0.35, length - 1, {
                ...LINE_OPTIONS,
                seed: LINE_SEED + index,
              });

          return drawable.sets
            .filter((set) => set.type === "path")
            .map((set) => generator.opsToPath(set, 2));
        })
        .join(" ")
    : "";

  const horizontal = orientation === "horizontal";

  return (
    <div aria-hidden className={className} ref={hostRef}>
      {d ? (
        <svg
          className={horizontal ? "block h-3 w-full overflow-visible" : "block h-full w-3 overflow-visible"}
          height={horizontal ? HEIGHT : length}
          viewBox={horizontal ? `0 0 ${length} ${HEIGHT}` : `0 0 ${HEIGHT} ${length}`}
          width={horizontal ? length : HEIGHT}
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
