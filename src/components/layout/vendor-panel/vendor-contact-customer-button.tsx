"use client";

import { Headset } from "lucide-react";
import Link from "next/link";

import { FOCUS_RING } from "@/components/layout/operational-panel";
// Caminho direto, não o barrel: ele também exporta os serviços `server-only` da feature,
// e importá-lo de um client component arrasta o WordPress inteiro para o bundle do navegador.
import { ChamadoOpenDialog } from "@/features/chamados/components/chamado-open-dialog";

const TRIGGER =
  "inline-flex h-11 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow";

/**
 * Ação de atendimento do pedido.
 *
 * Ficava num botão flutuante no canto da tela, que a 1024px cobria os valores do pedido — a
 * largura útil encolhe quando a sidebar aparece, e o flutuante não sabia disso. Agora é ação
 * normal, ao lado dos dados do comprador, e abre o chamado em vez de só navegar para a lista.
 */
export function VendorContactCustomerButton({ orderId }: { orderId: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ChamadoOpenDialog
        label="Abrir chamado com o cliente"
        orderId={orderId}
        role="seller"
        triggerClassName={[TRIGGER, FOCUS_RING].join(" ")}
      />
      <Link
        className={[
          "inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 underline decoration-2 underline-offset-4 hover:text-[#1a1a1a]",
          FOCUS_RING,
        ].join(" ")}
        href={`/vendor/chamados?pedido=${orderId}`}
      >
        <Headset aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
        Ver chamados deste pedido
      </Link>
    </div>
  );
}
