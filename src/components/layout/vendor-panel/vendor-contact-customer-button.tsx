import { Headset } from "lucide-react";
import Link from "next/link";

import { FOCUS_RING } from "@/components/layout/operational-panel";

const LABEL = "Entrar em contato com o cliente";

/**
 * Ação de suporte do pedido.
 *
 * Ficava num botão flutuante no canto da tela, que a 1024px cobria os valores
 * do pedido — a largura útil encolhe quando a sidebar aparece, e o flutuante
 * não sabia disso. Agora é ação normal, ao lado dos dados do comprador.
 */
export function VendorContactCustomerButton({ orderId }: { orderId: number }) {
  return (
    <Link
      className={[
        "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
        FOCUS_RING,
      ].join(" ")}
      href={`/vendor/pedidos/${orderId}/suporte`}
    >
      <Headset aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      {LABEL}
    </Link>
  );
}
