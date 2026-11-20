import type { AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext } from "@/features/expocannabis/types/context";
import type { QuoteShipping } from "@/features/expocannabis/types/quote";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { kitDiscountLabel } from "@/features/expocannabis/utils/kit-discount";
import { previewPricing } from "@/features/expocannabis/utils/pricing-preview";

import { SectionLabel } from "./section-label";

type OrderSummaryProps = {
  context: EventContext;
  state: AttendanceState;
};

function Row({ label, value, muted = false }: Readonly<{ label: string; value: string; muted?: boolean }>) {
  return (
    <div className="flex justify-between gap-3 text-[15px] font-semibold">
      <dt className={muted ? "text-[#52525B]" : ""}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function unitsLabel(units: number): string {
  return `${units} ${units === 1 ? "unidade" : "unidades"}`;
}

function kitLabel(kits: number, pctOff: number): string {
  const discount = kitDiscountLabel(pctOff);
  return `Kit de Sedas Premium${kits > 1 ? ` ×${kits}` : ""}${discount ? ` (${discount})` : ""}`;
}

function boxesLabel(volumes: number): string {
  if (volumes <= 0) return "";
  return ` · ${volumes} ${volumes === 1 ? "caixa" : "caixas"}`;
}

/** Linha do frete: valor cobrado, grátis ou contingência, sempre com quantas caixas o pedido leva. */
export function shippingLabel(shipping: QuoteShipping | null | undefined): string {
  if (!shipping) return "calculado ao continuar";
  const boxes = boxesLabel(shipping.volumes);
  if (shipping.waived) return `Grátis · postar por PAC${boxes}`;
  const charged = shipping.priceCents - shipping.discountCents;
  const price = charged > 0 ? formatCents(charged) : "Grátis";
  return `${price} · ${shipping.name}${boxes}`;
}

/** Resumo do pedido do checkout: da cotação do servidor quando há, da prévia antes dela. */
export function OrderSummary({ context, state }: Readonly<OrderSummaryProps>) {
  const preview = previewPricing(context, state.qty, state.kits);
  const quote = state.quote;
  const units = quote?.units ?? preview.units;
  const level = quote?.level ?? preview.level;
  const items = quote?.itemsCents ?? preview.itemsCents;
  const discount = quote?.discountCents ?? preview.discountCents;
  const kit = quote?.kit ?? preview.kit;
  const kitPctOff = quote?.kitPctOff ?? context.kit.pctOff;
  const pct = level.pctBp / 100;
  const frete = shippingLabel(quote?.shipping);

  return (
    <section aria-labelledby="expo-summary-title" className="rounded-[10px] border-[1.5px] border-[#E4E4E7] bg-white px-5 py-4.5">
      <SectionLabel id="expo-summary-title">Resumo</SectionLabel>
      <dl className="mt-2 grid gap-2">
        <Row label={`${unitsLabel(units)} · nível ${level.name}`} value={pct > 0 ? `${pct}% off em tudo` : "sem desconto de nível"} />
        <Row label="Produtos" value={formatCents(items)} muted />
        {discount > 0 ? <Row label="Desconto do nível" value={`− ${formatCents(discount)}`} /> : null}
        {kit.totalCents > 0 ? <Row label={kitLabel(kit.qty, kitPctOff)} value={formatCents(kit.totalCents)} muted /> : null}
        <Row label="Brinde" value={level.minUnits >= 10 ? "Bandeja chaveiro + merch" : "a partir de 10 un."} muted />
        <Row label="Frete" value={frete} muted />
        <div className="mt-1 flex items-baseline justify-between border-t border-[#E4E4E7] pt-2.5">
          <dt className="text-[17px] font-extrabold">Total</dt>
          <dd className="text-[26px] font-extrabold">{formatCents(quote?.totalCents ?? items)}</dd>
        </div>
      </dl>
    </section>
  );
}
