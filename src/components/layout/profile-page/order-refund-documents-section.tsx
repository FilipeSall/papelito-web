import { Download, Paperclip } from "lucide-react";

import type { ProfileOrderRefund } from "@/features/orders/types/profile-order-detail";

import { OrderTrackingCopyButton } from "./order-tracking-copy-button";
import { ProfilePanel, ProfileSectionHeading } from "./profile-panel";

const linkClass =
  "inline-flex h-10 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatUtcDate(value: string) {
  if (!value) return "";

  const date = new Date(`${value.replace(" ", "T")}Z`);

  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

/**
 * Documentos de um pedido estornado, na visão do comprador.
 *
 * Substitui a seção de documentos do pedido: com o dinheiro devolvido, o
 * recibo do pedido deixa de ser o documento vigente da compra e sai desta
 * área. Nada é apagado — ele continua registrado, e o recibo de estorno
 * carrega o número dele.
 *
 * Quem decide a troca é o WordPress, em `documentsSurface`.
 */
export function OrderRefundDocumentsSection({
  orderId,
  refund,
}: {
  orderId: string;
  refund: ProfileOrderRefund | null;
}) {
  const issued = refund?.status === "reembolsado" && Boolean(refund.receiptNumber);
  const settledDate = formatUtcDate(refund?.settledAt ?? "");

  return (
    <ProfilePanel tone="white">
      <article className="flex flex-col gap-4 px-5 py-5">
        <ProfileSectionHeading>Documentos do estorno</ProfileSectionHeading>

        {issued ? (
          <>
            <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
                Recibo de estorno
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <code className="font-mono text-sm font-bold tracking-widest text-[#1a1a1a]">
                  {refund?.receiptNumber}
                </code>
                <OrderTrackingCopyButton
                  label="Copiar número do recibo de estorno"
                  value={refund?.receiptNumber ?? ""}
                />
              </div>
              {settledDate ? (
                <p className="mt-1.5 text-xs font-semibold text-[#1a1a1a]/60">
                  Estorno concluído em {settledDate}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                className={linkClass}
                href={`/api/profile/orders/${orderId}/refund-receipt`}
                rel="noreferrer"
                target="_blank"
              >
                <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Ver recibo de estorno
              </a>
              <a
                className={linkClass}
                href={`/api/profile/orders/${orderId}/refund-receipt?download=1`}
              >
                <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Baixar PDF
              </a>
              {(refund?.proofId ?? 0) > 0 ? (
                <a
                  className={linkClass}
                  href={`/api/order-refunds/proofs/${refund?.proofId}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Paperclip aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Ver comprovante
                </a>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-xs font-semibold leading-5 text-[#1a1a1a]/65">
            O recibo de estorno fica disponível quando a devolução do valor for concluída.
          </p>
        )}

        <p className="text-xs font-semibold leading-5 text-[#1a1a1a]/65">
          O recibo do pedido deixou esta área quando o estorno foi concluído. Ele continua
          registrado, e o recibo de estorno traz o número dele.
        </p>
      </article>
    </ProfilePanel>
  );
}
