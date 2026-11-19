import type { EventLevel } from "@/features/expocannabis/types/context";
import { levelProgress } from "@/features/expocannabis/utils/level-progress";

import { LevelSegments } from "./level-bar";

type LevelCardProps = {
  levels: EventLevel[];
  units: number;
};

/** Caixa do nível no pedido: o desconto em número grande, a régua com as marcas e quanto falta. */
export function LevelCard({ levels, units }: Readonly<LevelCardProps>) {
  const progress = levelProgress(levels, units);
  const pct = progress.current.pctBp / 100;
  const unlocked = pct > 0;

  return (
    <div className="relative flex flex-col gap-4 bg-expo-noite p-4 text-white sm:min-h-31 sm:flex-row">
      <div
        className={`relative flex h-23 w-full flex-none flex-col justify-center px-3 sm:w-39 ${
          unlocked ? "bg-brand-yellow text-expo-ink" : "border-2 border-brand-yellow text-brand-yellow"
        }`}
      >
        <p className="ultra num text-[52px] leading-none">{`${pct}%`}</p>
        {unlocked ? (
          <span aria-hidden className="absolute right-4 top-3 text-[20px] font-bold">
            ✓
          </span>
        ) : null}
        <p className="mt-1 text-[10px] font-bold uppercase">{unlocked ? "Desbloqueado!" : "Bora destravar"}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[17px] font-bold uppercase">{unlocked ? "De desconto em tudo" : "Sem desconto ainda"}</p>
            <p className="text-[13px] font-bold text-brand-yellow">{`Nível ${progress.current.name}`}</p>
            <p className="num mt-1 text-[15px] font-bold">{progress.long}</p>
          </div>
          <div className="flex-none text-right">
            <p className="text-[10px] font-bold text-white/80">No pedido</p>
            <p className="num text-[18px] font-bold">{`${units} un.`}</p>
          </div>
        </div>
        <div className="mt-2">
          <LevelSegments levels={levels} units={units} height={5} />
          <div className="num mt-1.75 flex justify-between text-[10px] font-bold">
            {levels.slice(1).map((level) => (
              <span key={level.key} className={progress.current.key === level.key ? "text-brand-yellow" : "text-expo-nevoa"}>
                {`${level.minUnits} un. · ${level.pctBp / 100}%`}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
