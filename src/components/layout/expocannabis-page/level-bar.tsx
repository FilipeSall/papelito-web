import type { EventLevel } from "@/features/expocannabis/types/context";

type LevelBarProps = {
  levels: EventLevel[];
  units: number;
  dark?: boolean;
};

function segmentFill(units: number, from: number, to: number): number {
  if (units <= from) return 0;
  if (units >= to) return 100;
  return ((units - from) / (to - from)) * 100;
}

/** Barra de nível em três trechos (0–10, 10–20, 20–40) com o quanto falta para o próximo. */
export function LevelBar({ levels, units, dark = false }: Readonly<LevelBarProps>) {
  const bounds = levels.slice(1).map((level, index) => [levels[index].minUnits, level.minUnits]);
  const next = levels.find((level) => level.minUnits > units);
  const missing = next ? next.minUnits - units : 0;
  const text = next
    ? `${missing === 1 ? "Falta 1 unidade" : `Faltam ${missing} unidades`} pra ${next.name} (${next.pctBp / 100}% off).`
    : "Você chegou no topo: 12% off em tudo.";

  return (
    <div>
      <div className="flex gap-1" aria-hidden>
        {bounds.map(([from, to]) => (
          <div key={to} className={`h-2 flex-1 overflow-hidden rounded-sm ${dark ? "bg-white/20" : "bg-[#E4E4E7]"}`}>
            <div className="h-full bg-brand-yellow transition-[width] duration-300" style={{ width: `${segmentFill(units, from, to)}%` }} />
          </div>
        ))}
      </div>
      <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-[#52525B]"}`}>{text}</p>
    </div>
  );
}
