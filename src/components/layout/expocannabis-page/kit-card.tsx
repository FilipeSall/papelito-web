import Image from "next/image";

import type { EventKit } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { kitDiscountLabel } from "@/features/expocannabis/utils/kit-discount";

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

/** Preço do kit numa frase só: o teste do kit lê este texto inteiro, então ele não se divide em pedaços. */
function priceText(kit: EventKit): string {
  if (kit.unitCents >= kit.fullUnitCents) return formatCents(kit.unitCents);
  return `De ${formatCents(kit.fullUnitCents)} por ${formatCents(kit.unitCents)}`;
}

function KitOverlay({ discount, missing, units }: Readonly<{ discount: string; missing: number; units: number }>) {
  const progress = Math.min(1, units / KIT_MIN_UNITS) * 100;
  const text = `${missing === 1 ? "Falta 1 unidade" : `Faltam ${missing} unidades`} no pedido pra liberar ${discount ? `o ${discount}` : "o kit"}`;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-expo-noite/82 p-3 text-center text-white">
      <p className="text-base font-extrabold">{discount ? "Desconto do kit ainda bloqueado" : "Kit ainda bloqueado"}</p>
      <p className="num text-sm font-semibold text-expo-cinza">{text}</p>
      <div className="h-2 w-7/10 overflow-hidden bg-expo-carvao">
        <div className="h-full bg-brand-yellow transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

/**
 * Kit de Sedas Premium em faixa amarela: bloqueado abaixo de 10 unidades, liberado com o
 * desconto publicado pelo admin, no máximo 3. Com desconto 0% nenhum texto promete desconto,
 * nem o selo: é o admin que decide o número, não a arte.
 */
export function KitCard({ kit, units, kits, onAdd }: Readonly<KitCardProps>) {
  const locked = units < KIT_MIN_UNITS;
  const discount = kitDiscountLabel(kit.pctOff);
  const disabled = locked || kits >= KIT_MAX;

  if (!kit.available) {
    return (
      <section aria-labelledby="expo-kit-title" className="border-2 border-dashed border-expo-borda p-4">
        <h3 id="expo-kit-title" className="ultra text-[22px] leading-7 text-white">
          Kit de Sedas Premium
        </h3>
        <p className="text-sm font-semibold text-expo-cinza">Kit indisponível agora.</p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="expo-kit-title"
      className="relative flex flex-wrap items-center gap-x-4 gap-y-3 bg-brand-yellow p-1.5 text-expo-ink sm:min-h-23 sm:flex-nowrap"
    >
      <div className="relative h-22 w-39 flex-none max-sm:h-28 max-sm:w-full">
        <Image
          src="/images/expocannabis/kit-sedas-premium.png"
          alt="Kit de Sedas Premium: Insane, Insane Brown, Alfafa e Pink"
          fill
          sizes="320px"
          className={`object-contain ${locked ? "opacity-35" : ""}`}
        />
        {locked ? (
          <KitOverlay discount={discount} missing={KIT_MIN_UNITS - units} units={units} />
        ) : (
          <span className="expo-carimbo absolute left-1 top-1 bg-expo-noite px-2 py-1 text-xs font-extrabold uppercase tracking-[0.06em] text-brand-yellow">
            {discount ? `${discount} liberado` : "Kit liberado"}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 id="expo-kit-title" className="ultra text-[24px] leading-7">
          Kit de Sedas Premium
        </h3>
        <p className="num text-[15px] font-bold">{priceText(kit)}</p>
      </div>
      <div className="flex w-full flex-col gap-1 px-2 pb-2 sm:w-59 sm:px-0 sm:pb-0 sm:pr-2.5">
        {kit.unitCents < kit.fullUnitCents ? (
          <p className="num text-xs font-bold uppercase">{`Economize ${formatCents(kit.fullUnitCents - kit.unitCents)} por kit`}</p>
        ) : null}
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="relative flex min-h-12.5 items-center justify-center px-3 text-center text-base font-bold leading-tight text-white"
        >
          <Image src="/images/expocannabis/figma/botao-recorte-preto.svg" alt="" fill aria-hidden className={disabled ? "opacity-45" : ""} />
          <span className="relative">{kitButtonLabel(locked, kits)}</span>
        </button>
      </div>
    </section>
  );
}
