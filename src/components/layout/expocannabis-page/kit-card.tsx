import { Lock } from "lucide-react";
import Image from "next/image";

import type { EventKit } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";

type KitCardProps = {
  kit: EventKit;
  units: number;
  kits: number;
  onAdd: () => void;
};

const KIT_MIN_UNITS = 10;
const KIT_MAX = 3;

function kitButtonLabel(locked: boolean, kits: number): string {
  if (locked) return "Bloqueado";
  if (kits >= KIT_MAX) return "Máximo de 3 kits";
  return kits > 0 ? "+1 kit" : "Adicionar kit";
}

function KitOverlay({ missing, units }: Readonly<{ missing: number; units: number }>) {
  const progress = Math.min(1, units / KIT_MIN_UNITS) * 100;
  const text = `${missing === 1 ? "Falta 1 unidade" : `Faltam ${missing} unidades`} no pedido pra liberar o −15%`;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-[#231F20]/78 p-3 text-center text-white">
      <Lock aria-hidden size={28} strokeWidth={2.2} className="text-brand-yellow" />
      <p className="text-base font-extrabold">Desconto do kit ainda bloqueado</p>
      <p className="text-sm font-semibold text-[#e4e4e7]">{text}</p>
      <div className="h-2 w-7/10 overflow-hidden rounded-sm bg-[#4a4446]">
        <div className="h-full bg-brand-yellow transition-[width] duration-350 ease-[ease] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function KitFooter({ kit, locked, kits, onAdd }: Readonly<Pick<KitCardProps, "kit" | "kits" | "onAdd"> & { locked: boolean }>) {
  const disabled = locked || kits >= KIT_MAX;
  const tone = disabled ? "bg-[#E4E4E7] text-[#52525b]" : "bg-brand-yellow text-[#231F20]";

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <h3 id="expo-kit-title" className="text-[17px] font-extrabold leading-[1.2]">
          Kit de Sedas Premium
        </h3>
        <p className="mt-0.75 text-sm font-semibold text-[#52525B]">
          {`De ${formatCents(kit.fullUnitCents)} por ${formatCents(kit.unitCents)}${locked ? " a partir de 10 unidades" : ""}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className={`min-h-12 flex-none rounded-md px-4 text-[15px] font-extrabold transition-transform duration-120 active:scale-95 motion-reduce:transition-none ${tone}`}
      >
        {kitButtonLabel(locked, kits)}
      </button>
    </div>
  );
}

/** Kit de Sedas Premium: bloqueado abaixo de 10 unidades (tracejado), liberado com −15% (borda amarela), no máximo 3. */
export function KitCard({ kit, units, kits, onAdd }: Readonly<KitCardProps>) {
  const locked = units < KIT_MIN_UNITS;

  if (!kit.available) {
    return (
      <section aria-labelledby="expo-kit-title" className="rounded-[10px] border-2 border-dashed border-[#D4D4D8] p-4">
        <h3 id="expo-kit-title" className="text-base font-extrabold">
          Kit de Sedas Premium
        </h3>
        <p className="text-sm text-[#52525B]">Kit indisponível agora.</p>
      </section>
    );
  }

  const border = locked ? "border-dashed border-[#231F20]" : "border-solid border-brand-yellow";

  return (
    <section aria-labelledby="expo-kit-title" className={`flex flex-col gap-3 rounded-[10px] border-2 bg-white p-4 ${border}`}>
      <div className="relative flex h-35 items-center justify-center rounded-lg bg-[#F4F4F5]">
        <div className={`relative h-31 w-full ${locked ? "opacity-35" : ""}`}>
          <Image src="/images/expocannabis/kit-sedas-premium.png" alt="Kit de Sedas Premium: Insane, Insane Brown, Alfafa e Pink" fill sizes="320px" className="object-contain" />
        </div>
        {locked ? (
          <KitOverlay missing={KIT_MIN_UNITS - units} units={units} />
        ) : (
          <span className="expo-popin absolute left-2.5 top-2.5 rounded-sm bg-brand-yellow px-2 py-1 text-xs font-extrabold uppercase tracking-[0.06em]">
            −15% liberado
          </span>
        )}
      </div>
      <KitFooter kit={kit} locked={locked} kits={kits} onAdd={onAdd} />
    </section>
  );
}
