import type { AttendanceState } from "@/features/expocannabis/hooks/attendance-reducer";
import type { EventContext } from "@/features/expocannabis/types/context";
import { formatCents } from "@/features/expocannabis/utils/cart";
import { previewPricing } from "@/features/expocannabis/utils/pricing-preview";

type OrderSummaryProps = {
  context: EventContext;
  state: AttendanceState;
};

function Row({ label, value, strong = false }: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-xl font-extrabold" : "text-base"}`}>
      <dt>{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

/** Resumo do pedido do checkout: da cotação do servidor quando há, da prévia antes dela. */
export function OrderSummary({ context, state }: Readonly<OrderSummaryProps>) {
  const preview = previewPricing(context, state.qty, state.kits);
  const quote = state.quote;
  const units = quote?.units ?? preview.units;
  const level = quote?.level ?? preview.level;
  const items = quote?.itemsCents ?? preview.itemsCents;
  const discount = quote?.discountCents ?? preview.discountCents;
  const kitTotal = quote?.kit.totalCents ?? preview.kit.totalCents;

  return (
    <section aria-labelledby="expo-summary-title" className="rounded-lg border-2 border-[#231F20] bg-white p-5">
      <h2 id="expo-summary-title" className="text-xs font-extrabold uppercase tracking-[0.08em]">
        Resumo do pedido
      </h2>
      <dl className="mt-3 grid gap-2">
        <Row label="Unidades" value={`${units} · ${level.name}`} />
        <Row label={`Desconto do nível (${level.pctBp / 100}%)`} value={`− ${formatCents(discount)}`} />
        {kitTotal > 0 ? <Row label="Kit Premium" value={formatCents(kitTotal)} /> : null}
        <Row label="Brinde" value={level.minUnits >= 10 ? "Bandeja chaveiro + merch" : "—"} />
        <Row label="Produtos" value={formatCents(items)} />
        <Row label="Frete" value={quote ? `${formatCents(quote.shipping.priceCents)} · ${quote.shipping.name}` : "calculado ao continuar"} />
        <Row label="Total" value={formatCents(quote?.totalCents ?? items)} strong />
      </dl>
    </section>
  );
}
