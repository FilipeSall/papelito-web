import type { AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";
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

function kitLabel(kits: number): string {
  return `Kit de Sedas Premium${kits > 1 ? ` ×${kits}` : ""} (−15%)`;
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
  const pct = level.pctBp / 100;
  const frete = quote ? `${formatCents(quote.shipping.priceCents)} · ${quote.shipping.name}` : "calculado ao continuar";

  return (
    <section aria-labelledby="expo-summary-title" className="rounded-[10px] border-[1.5px] border-[#E4E4E7] bg-white px-5 py-4.5">
      <SectionLabel id="expo-summary-title">Resumo</SectionLabel>
      <dl className="mt-2 grid gap-2">
        <Row label={`${unitsLabel(units)} · nível ${level.name}`} value={pct > 0 ? `${pct}% off em tudo` : "sem desconto de nível"} />
        <Row label="Produtos" value={formatCents(items)} muted />
        {discount > 0 ? <Row label="Desconto do nível" value={`− ${formatCents(discount)}`} /> : null}
        {kit.totalCents > 0 ? <Row label={kitLabel(kit.qty)} value={formatCents(kit.totalCents)} muted /> : null}
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
