import type { EventLevel } from "@/features/expocannabis/types/context";
import { formatWholeCents } from "@/features/expocannabis/utils/cart";
import { levelProgress } from "@/features/expocannabis/utils/level-progress";

import { LevelSegments } from "./level-bar";

type LevelCardProps = {
  levels: EventLevel[];
  baseCents: number;
};

/** Cartão escuro do pedido: nível atual, desconto, trechos, marcas dos níveis e quanto falta. */
export function LevelCard({ levels, baseCents }: Readonly<LevelCardProps>) {
  const progress = levelProgress(levels, baseCents);

  return (
    <div className="mx-6 flex flex-none flex-col gap-2.5 rounded-[10px] bg-[#231F20] px-4 pb-3.5 pt-4 text-white">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-brand-yellow">{`Nível ${progress.current.name}`}</p>
        <p className="text-[15px] font-extrabold">{`${progress.current.pctBp / 100}% off em tudo`}</p>
      </div>
      <LevelSegments levels={levels} baseCents={baseCents} dark />
      <div className="flex justify-between text-[11px] font-bold text-[#d4d4d8]">
        {levels.slice(1).map((level) => (
          <span key={level.key}>{`${formatWholeCents(level.minCents)} · ${level.name} ${level.pctBp / 100}%`}</span>
        ))}
      </div>
      <p className="text-sm font-semibold">{progress.long}</p>
    </div>
  );
}
