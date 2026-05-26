import rough from "roughjs";

const VB_WIDTH = 120;
const VB_HEIGHT = 12;

const generator = rough.generator();
const drawable = generator.line(4, 7, 116, 5, {
  roughness: 1.5,
  bowing: 2,
  strokeWidth: 1.6,
  seed: 11,
});

const ROUGH_PATHS = drawable.sets
  .filter((set) => set.type === "path")
  .map((set) => generator.opsToPath(set, 2));

export function MenuUnderline() {
  return (
    <svg
      aria-hidden="true"
      className="menu-underline pointer-events-none absolute bottom-0 left-0 z-[-1] h-1.5 w-full overflow-visible text-black"
      preserveAspectRatio="none"
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
    >
      {ROUGH_PATHS.map((d, i) => (
        <path key={i} d={d} pathLength={1} />
      ))}
    </svg>
  );
}
