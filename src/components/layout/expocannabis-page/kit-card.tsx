import Image from "next/image";

import type { EventKit, EventLevel } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { kitDiscountLabel } from "@/features/expocannabis/utils/kit-discount";
import { missingCents } from "@/features/expocannabis/utils/level-progress";
import { firstDiscountCents } from "@/features/expocannabis/utils/pricing-preview";

type KitCardProps = {
  kit: EventKit;
  levels: EventLevel[];
  /** Base da faixa: é ela que libera o kit, e o próprio kit conta nela. */
  baseCents: number;
  kits: number;
  onAdd: () => void;
};

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

function lockText(discount: string, missing: number): string {
  return `Faltam ${missingCents(missing)} no pedido pra liberar ${discount ? `o ${discount}` : "o kit"}`;
}

/**
 * Kit de Sedas Premium em faixa amarela: bloqueado abaixo de 10 unidades, liberado com o
 * desconto publicado pelo admin, no máximo 3.
 *
 * O bloco é uma coluna só, e não imagem ao lado de texto com quebra por viewport: ele mora
 * tanto na folha larga do retrato quanto no painel de 440 px da paisagem, e é o container
 * que aperta, não a tela. Com desconto 0% nenhum texto promete desconto, nem o selo: quem
 * decide esse número é o admin, não a arte.
 */
export function KitCard({ kit, levels, baseCents, kits, onAdd }: Readonly<KitCardProps>) {
  const minCents = firstDiscountCents(levels);
  const locked = baseCents < minCents;
  const discount = kitDiscountLabel(kit.pctOff);
  const disabled = locked || kits >= KIT_MAX;
  const progress = Math.min(1, baseCents / minCents) * 100;

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
    <section aria-labelledby="expo-kit-title" className="flex flex-col gap-2.5 bg-brand-yellow p-3 text-expo-ink">
      <div className="flex items-center gap-3">
        <div className="relative h-20 w-28 flex-none">
          <Image
            src="/images/expocannabis/kit-sedas-premium.png"
            alt="Kit de Sedas Premium: Insane, Insane Brown, Alfafa e Pink"
            fill
            sizes="160px"
            className={`object-contain ${locked ? "opacity-35" : ""}`}
          />
          {locked ? null : (
            <span className="expo-carimbo absolute left-0 top-0 bg-expo-noite px-1.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-brand-yellow">
              {discount ? `${discount} liberado` : "Kit liberado"}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="expo-kit-title" className="ultra text-[20px] leading-6">
            Kit de Sedas Premium
          </h3>
          <p className="num mt-0.5 text-sm font-bold">{priceText(kit)}</p>
          {locked ? (
            <>
              <p className="mt-1 text-[13px] font-extrabold">{discount ? "Desconto do kit ainda bloqueado" : "Kit ainda bloqueado"}</p>
              <p className="num text-[13px] font-semibold">{lockText(discount, minCents - baseCents)}</p>
              <div className="mt-1.5 h-1.5 w-full bg-expo-ink/25">
                <div className="h-full bg-expo-ink transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            kit.unitCents < kit.fullUnitCents && (
              <p className="num mt-1 text-xs font-bold uppercase">{`Economize ${formatCents(kit.fullUnitCents - kit.unitCents)} por kit`}</p>
            )
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="relative flex min-h-12 w-full items-center justify-center px-3 text-center text-base font-bold leading-tight text-white"
      >
        <Image src="/images/expocannabis/figma/botao-recorte-preto.svg" alt="" fill aria-hidden className={disabled ? "opacity-45" : ""} />
        <span className="relative">{kitButtonLabel(locked, kits)}</span>
      </button>
    </section>
  );
}
