import { Headset } from "lucide-react";
import Link from "next/link";

const TOOLTIP_LABEL = "Entrar em contato com o cliente";

export function VendorContactCustomerButton({ orderId }: { orderId: number }) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Link
        aria-label={TOOLTIP_LABEL}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-dark text-brand-yellow shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2"
        href={`/vendor/pedidos/${orderId}/suporte`}
      >
        <Headset aria-hidden className="h-6 w-6" />
        <span
          className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-full bg-brand-dark px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition group-focus-visible:opacity-100 group-hover:opacity-100"
          role="tooltip"
        >
          {TOOLTIP_LABEL}
        </span>
      </Link>
    </div>
  );
}
