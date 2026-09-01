import { CouponField } from "@/components/ui/coupon-field";
import { ShippingSummaryRow } from "@/components/ui/shipping-summary-row";
import { formatBRL } from "@/lib/format-currency";
import { buildPrivatePageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPrivatePageMetadata("Verificação interna");

const SUBTOTAL = 121;

const CASES = [
  { label: "A · sem modalidade escolhida", shipping: null, shippingDiscount: 0, free: false },
  { label: "B · PAC escolhido, sem benefício", shipping: 16.27, shippingDiscount: 0, free: false },
  { label: "C · PAC com frete grátis", shipping: 16.27, shippingDiscount: 16.27, free: true },
  { label: "D · SEDEX com frete grátis", shipping: 10.36, shippingDiscount: 10.36, free: true },
];

export default function VerifyShippingRowPage() {
  return (
    <main className="bg-bg-light">
      <section className="mx-auto grid w-full max-w-391 gap-6 px-6 py-12 md:grid-cols-2 md:px-8">
        {CASES.map((item) => (
          <div
            className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]"
            key={item.label}
          >
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-brand-dark/48">
              {item.label}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-tertiary">Subtotal</span>
                <span className="text-sm font-medium text-brand-dark">{formatBRL(SUBTOTAL)}</span>
              </div>

              <ShippingSummaryRow
                isFreeShippingApplied={item.free}
                shipping={item.shipping}
                shippingDiscount={item.shippingDiscount}
              />
            </div>

            <div className="mt-4 border-t border-[#F3F4F6] pt-4">
              <CouponField />
            </div>

            <div className="mt-3 flex items-baseline justify-between border-t border-[#F3F4F6] pt-3">
              <span className="text-lg font-black uppercase text-brand-dark">Total</span>
              <span className="text-[28px] font-black leading-8 tracking-[-0.4492px] text-brand-dark">
                {formatBRL(SUBTOTAL + (item.shipping ?? 0) - item.shippingDiscount)}
              </span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
