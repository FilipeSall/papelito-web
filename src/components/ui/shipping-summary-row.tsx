import { formatBRL } from "@/lib/format-currency";

type ShippingSummaryRowProps = {
  /** `null` enquanto nenhuma modalidade de entrega válida foi escolhida. */
  shipping: number | null;
  shippingDiscount: number;
  isFreeShippingApplied: boolean;
  labelClassName?: string;
  valueClassName?: string;
};

/**
 * Linha de frete do resumo. Sem modalidade escolhida o valor é desconhecido e a
 * linha diz isso em vez de exibir um número; com frete grátis aplicado o preço
 * original aparece riscado ao lado do selo.
 */
export function ShippingSummaryRow({
  isFreeShippingApplied,
  labelClassName = "text-sm text-text-tertiary",
  shipping,
  shippingDiscount,
  valueClassName = "text-sm font-medium text-brand-dark",
}: ShippingSummaryRowProps) {
  if (shipping === null) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className={labelClassName}>Frete</span>
        <span className="text-sm text-text-muted">A calcular no checkout</span>
      </div>
    );
  }

  if (isFreeShippingApplied) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className={labelClassName}>Frete</span>
        <span className="flex items-center gap-2">
          <s className="text-sm text-text-muted">{formatBRL(shipping)}</s>
          <span className="animate-free-shipping rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#15803D]">
            Frete grátis
          </span>
        </span>
      </div>
    );
  }

  if (shippingDiscount > 0) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className={labelClassName}>Frete</span>
        <span className="flex items-center gap-2">
          <s className="text-sm text-text-muted">{formatBRL(shipping)}</s>
          <span className={valueClassName}>{formatBRL(shipping - shippingDiscount)}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className={labelClassName}>Frete</span>
      <span className={valueClassName}>{formatBRL(shipping)}</span>
    </div>
  );
}
