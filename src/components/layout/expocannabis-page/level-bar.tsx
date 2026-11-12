import type { EventLevel } from "@/features/expocannabis/types/context";
import { levelBounds, levelProgress, segmentFill } from "@/features/expocannabis/utils/level-progress";

type LevelSegmentsProps = {
  levels: EventLevel[];
  units: number;
  dark?: boolean;
};

type LevelBarProps = {
  levels: EventLevel[];
  units: number;
  dark?: boolean;
};

/** Três trechos de 8 px (0–10, 10–20, 20–40) que enchem em 350 ms; clara com preenchimento preto, escura com amarelo. */
export function LevelSegments({ levels, units, dark = false }: Readonly<LevelSegmentsProps>) {
  const track = dark ? "bg-[#3f3a3b]" : "bg-[#E4E4E7]";
  const fill = dark ? "bg-brand-yellow" : "bg-[#231F20]";

  return (
    <div className="flex gap-1" aria-hidden>
      {levelBounds(levels).map(([from, to]) => (
        <div key={to} className={`relative h-2 flex-1 overflow-hidden rounded-sm ${track}`}>
          <i
            className={`absolute inset-y-0 left-0 ${fill} transition-[width] duration-350 ease-[ease] motion-reduce:transition-none`}
            style={{ width: `${segmentFill(units, from, to)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

/** Linha do nível: "Lojista · 0%", os trechos e "Faltam N pra X%". Texto claro na variante escura. */
export function LevelBar({ levels, units, dark = true }: Readonly<LevelBarProps>) {
  const progress = levelProgress(levels, units);
  const tone = dark ? "text-white" : "text-[#231F20]";

  return (
    <div className={`flex items-center gap-3.5 ${tone}`}>
      <p className="flex-none text-[15px] font-bold">{`${progress.current.name} · ${progress.current.pctBp / 100}%`}</p>
      <div className="flex-1">
        <LevelSegments levels={levels} units={units} dark={dark} />
      </div>
      <p className="flex-none text-sm font-semibold">{progress.short}</p>
    </div>
  );
}
