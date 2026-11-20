import type { EventLevel } from "@/features/expocannabis/types/context";
import { levelBounds, levelProgress, segmentFill } from "@/features/expocannabis/utils/level-progress";

type LevelSegmentsProps = {
  levels: EventLevel[];
  baseCents: number;
  dark?: boolean;
  height?: number;
};

type LevelBarProps = {
  levels: EventLevel[];
  baseCents: number;
  dark?: boolean;
};

/** Régua do pedido: um trecho por nível acima do primeiro, trilho carvão e preenchimento amarelo. */
export function LevelSegments({ levels, baseCents, dark = false, height = 8 }: Readonly<LevelSegmentsProps>) {
  const track = dark ? "bg-expo-carvao" : "bg-white/20";

  return (
    <div className="flex w-full gap-1" aria-hidden>
      {levelBounds(levels).map(([from, to]) => (
        <span key={to} className={`relative flex-1 ${track}`} style={{ height }}>
          <span
            className="absolute inset-y-0 left-0 bg-brand-yellow transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${segmentFill(baseCents, from, to)}%` }}
          />
        </span>
      ))}
    </div>
  );
}

/** Linha do nível: "Lojista · 0%" em amarelo, a régua e "Faltam N pra X%". */
export function LevelBar({ levels, baseCents, dark = true }: Readonly<LevelBarProps>) {
  const progress = levelProgress(levels, baseCents);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="flex justify-between gap-3 text-sm">
        <span className="font-extrabold text-brand-yellow">{`${progress.current.name} · ${progress.current.pctBp / 100}%`}</span>
        <span className="num font-semibold text-white">{progress.short}</span>
      </p>
      <LevelSegments levels={levels} baseCents={baseCents} dark={dark} />
    </div>
  );
}
