import type { EventLevel } from "@/features/expocannabis/types/context";
import { compactCents, levelProgress } from "@/features/expocannabis/utils/level-progress";
import { formatCents } from "@/features/expocannabis/utils/cart";

import { LevelSegments } from "./level-bar";

type LevelCardProps = {
  levels: EventLevel[];
  /** Base da faixa: é ela que anda na régua, não a quantidade. */
  baseCents: number;
  /** Corte do frete grátis publicado pelo evento; `null` quando o WordPress ainda não manda. */
  freeFromCents: number | null;
};

/** Caixa do nível no pedido: o desconto em número grande, a régua com as marcas e quanto falta. */
export function LevelCard({ levels, baseCents, freeFromCents }: Readonly<LevelCardProps>) {
  const progress = levelProgress(levels, baseCents);
  const pct = progress.current.pctBp / 100;
  const unlocked = pct > 0;

  return (
    <div className="relative flex flex-col gap-4 bg-expo-noite p-4 text-white sm:min-h-31 sm:flex-row">
      <div
        className={`relative flex h-23 w-full flex-none flex-col justify-center px-3 sm:w-30 ${
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
        <div className="min-w-0">
          <p className="text-[17px] font-bold uppercase leading-tight">{unlocked ? "De desconto em tudo" : "Sem desconto ainda"}</p>
          <p className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-bold text-brand-yellow">
            {`Nível ${progress.current.name}`}
            <span className="num font-semibold text-white/80">{`base ${formatCents(baseCents)}`}</span>
          </p>
          <p className="num mt-1 text-[15px] font-bold leading-snug">{progress.long}</p>
        </div>
        <div className="mt-2">
          <LevelSegments levels={levels} baseCents={baseCents} height={5} />
          <div className="num mt-1.75 flex justify-between text-[10px] font-bold">
            {levels.slice(1).map((level) => (
              <span key={level.key} className={progress.current.key === level.key ? "text-brand-yellow" : "text-expo-nevoa"}>
                {`${compactCents(level.minCents)} · ${level.pctBp / 100}%`}
              </span>
            ))}
          </div>
        </div>
        {freeFromCents === null ? null : (
          <p className={`num mt-2 text-[13px] font-bold ${baseCents >= freeFromCents ? "text-brand-yellow" : "text-expo-cinza"}`}>
            {baseCents >= freeFromCents ? "✓ Frete grátis neste pedido" : `Frete grátis a partir de ${compactCents(freeFromCents)}`}
          </p>
        )}
      </div>
    </div>
  );
}
