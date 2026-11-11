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

/** Kit de Sedas Premium: bloqueado abaixo de 10 unidades, liberado com −15% e no máximo 3. */
export function KitCard({ kit, units, kits, onAdd }: Readonly<KitCardProps>) {
  const locked = units < KIT_MIN_UNITS;
  const missing = KIT_MIN_UNITS - units;
  const label = kitButtonLabel(locked, kits);

  if (!kit.available) {
    return (
      <section aria-labelledby="expo-kit-title" className="rounded-lg border-2 border-dashed border-[#D4D4D8] p-4">
        <h3 id="expo-kit-title" className="text-base font-extrabold">
          Kit de Sedas Premium
        </h3>
        <p className="text-sm text-[#52525B]">Kit indisponível agora.</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="expo-kit-title"
      className={`rounded-lg border-2 p-4 ${locked ? "border-dashed border-[#231F20]" : "border-brand-yellow bg-[#FFFBD6]"}`}
    >
      <div className={`relative h-24 ${locked ? "opacity-35" : ""}`}>
        <Image src="/images/expocannabis/kit-sedas-premium.png" alt="" fill sizes="320px" className="object-contain" />
      </div>
      {locked ? (
        <>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.08em]">Desconto do kit ainda bloqueado</p>
          <p className="text-sm font-semibold">
            {missing === 1 ? "Falta 1 unidade" : `Faltam ${missing} unidades`} no pedido pra liberar o −15%
          </p>
        </>
      ) : (
        <span className="expo-pop mt-2 inline-block rounded-sm bg-[#231F20] px-2 py-0.5 text-xs font-extrabold text-brand-yellow">
          −15% liberado
        </span>
      )}
      <h3 id="expo-kit-title" className="mt-2 text-base font-extrabold">
        Kit de Sedas Premium
      </h3>
      <p className="text-sm text-[#52525B]">
        De {formatCents(kit.fullUnitCents)} por {formatCents(kit.unitCents)}
        {locked ? " a partir de 10 unidades" : ""}
      </p>
      {kits > 0 ? <p className="text-sm font-bold">{`${kits} ${kits === 1 ? "kit" : "kits"} no pedido`}</p> : null}
      <button
        type="button"
        onClick={onAdd}
        disabled={locked || kits >= KIT_MAX}
        className="mt-3 h-11 w-full rounded-md bg-[#231F20] text-base font-extrabold text-brand-yellow disabled:bg-[#E4E4E7] disabled:text-[#52525B]"
      >
        {label}
      </button>
    </section>
  );
}
