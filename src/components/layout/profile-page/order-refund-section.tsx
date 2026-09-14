import Link from "next/link";
import { Download, Paperclip } from "lucide-react";

import { ChamadoOpenDialog } from "@/features/chamados/components/chamado-open-dialog";
import type { ProfileOrderRefund } from "@/features/orders/types/profile-order-detail";

import { ProfilePanel, ProfileSectionHeading, profileSecondaryActionClass } from "./profile-panel";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

const linkClass =
  "inline-flex h-10 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

function formatUtcDate(value: string) {
  if (!value) return "";

  const date = new Date(`${value.replace(" ", "T")}Z`);

  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

/**
 * Estorno do pedido que a loja cancelou depois do pagamento. No caminho manual
 * é o comprador quem confere se o valor chegou — e o chamado é como contesta.
 */
export function OrderRefundSection({ orderId, refund }: { orderId: string; refund: ProfileOrderRefund }) {
  const amount = (refund.amountCents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
  const done = refund.status === "reembolsado";
  const manual = refund.mode === "manual";
  const dueDate = formatUtcDate(refund.refundDueAt);
  const settledDate = formatUtcDate(refund.settledAt);

  return (
    <ProfilePanel tone="white">
      <article className="flex flex-col gap-4 px-5 py-5">
        <ProfileSectionHeading>Estorno do pedido</ProfileSectionHeading>

        <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
            {done ? "Valor devolvido" : "Valor a receber"}
          </p>
          <p className="mt-1.5 text-lg font-black tabular-nums text-[#1a1a1a]">{amount}</p>
        </div>

        {done ? (
          <p className="text-sm font-bold leading-6 text-[#1f6b3a]">
            ✓ {manual ? `A loja registrou a devolução em ${settledDate}.` : `Estorno concluído em ${settledDate}.`}
          </p>
        ) : manual ? (
          <p className="text-sm leading-6 text-[#1a1a1a]/75">
            A loja cancelou o pedido e vai devolver o valor por transferência{dueDate ? ` até ${dueDate}` : ""}.
          </p>
        ) : (
          <p className="text-sm leading-6 text-[#1a1a1a]/75">
            A loja cancelou o pedido e o estorno foi pedido na forma de pagamento original. O prazo para o
            valor aparecer depende do seu banco ou da operadora do cartão.
          </p>
        )}

        {!done && manual && refund.overdue ? (
          <p
            className="border-2 border-[#c0392b] bg-white px-4 py-3 text-xs font-bold leading-5 text-[#c0392b]"
            role="alert"
          >
            ⚠ O prazo da loja passou. A Papelito já acompanha este estorno; se precisar, abra um chamado.
          </p>
        ) : null}

        {!done && manual ? (
          <Link
            className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 underline decoration-2 underline-offset-4 hover:text-[#1a1a1a]"
            href="/perfil/dados#chave-pix-reembolso"
          >
            Revisar chave PIX para reembolso
          </Link>
        ) : null}

        {done && refund.receiptNumber ? (
          <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
              Recibo de estorno
            </p>
            <code className="mt-1.5 block font-mono text-sm font-bold tracking-widest text-[#1a1a1a]">
              {refund.receiptNumber}
            </code>
            <div className="mt-3 flex flex-wrap gap-2">
              <a className={linkClass} href={`/api/profile/orders/${orderId}/refund-receipt`} rel="noreferrer" target="_blank">
                <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Baixar recibo de estorno
              </a>
              {refund.proofId > 0 ? (
                <a className={linkClass} href={`/api/order-refunds/proofs/${refund.proofId}`} rel="noreferrer" target="_blank">
                  <Paperclip aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Ver comprovante
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {manual ? (
          <ChamadoOpenDialog
            label={done ? "Não recebi o valor" : "Falar sobre o estorno"}
            orderId={Number(orderId)}
            role="customer"
            triggerClassName={`${profileSecondaryActionClass} w-full`}
          />
        ) : null}
      </article>
    </ProfilePanel>
  );
}
