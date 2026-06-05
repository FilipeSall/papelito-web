import type { CSSProperties } from "react";
import rough from "roughjs";
import type { Options } from "roughjs/bin/core";

const VB_WIDTH = 120;
const VB_HEIGHT = 11;

const generator = rough.generator();

const DEFAULT_OPTIONS: Options = {
  roughness: 1.5,
  bowing: 2,
  strokeWidth: 1.6,
  seed: 11,
};

const pathCache = new Map<string, string[]>();

function getPaths(options: Options, lineYOffsets: number[]) {
  const key = JSON.stringify({ options, lineYOffsets });
  const cached = pathCache.get(key);
  if (cached) {
    return cached;
  }

  const paths = lineYOffsets.flatMap((offset, index) => {
    const seed = options.seed != null ? options.seed + index * 17 : undefined;
    const drawable = generator.line(4, offset, 116, offset - 2, { ...options, seed });

    return drawable.sets
      .filter((set) => set.type === "path")
      .map((set) => generator.opsToPath(set, 2));
  });

  pathCache.set(key, paths);
  return paths;
}

interface MenuUnderlineProps {
  className?: string;
  options?: Options;
  lineYOffsets?: number[];
  animationDurationMs?: number;
  staggerMs?: number;
  /** Espessura do traço em px. Sobrescreve o padrão do CSS via custom property. */
  strokeWidth?: number;
}

export function MenuUnderline({
  className = "text-black z-[-1] h-1.5",
  options = DEFAULT_OPTIONS,
  lineYOffsets = [7],
  animationDurationMs,
  staggerMs,
  strokeWidth,
}: MenuUnderlineProps) {
  const paths = getPaths(options, lineYOffsets);
  const style =
    strokeWidth != null || animationDurationMs != null
      ? ({
          ...(strokeWidth != null ? { "--menu-underline-stroke": `${strokeWidth}px` } : {}),
          ...(animationDurationMs != null
            ? { "--menu-underline-duration": `${animationDurationMs}ms` }
            : {}),
        } as CSSProperties)
      : undefined;

  return (
    <svg
      aria-hidden="true"
      className={`menu-underline pointer-events-none absolute bottom-0 left-0 w-full overflow-visible ${className}`}
      preserveAspectRatio="none"
      style={style}
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={1}
          style={staggerMs != null ? { animationDelay: `${i * staggerMs}ms` } : undefined}
        />
      ))}
    </svg>
  );
}
