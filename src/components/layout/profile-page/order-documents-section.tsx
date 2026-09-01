import type { ProfileOrderReceipt } from "@/features/orders";

import { OrderReceiptActions } from "./order-receipt-actions";
import { OrderTrackingCopyButton } from "./order-tracking-copy-button";
import { ProfilePanel, ProfileSectionHeading } from "./profile-panel";

type OrderDocumentsSectionProps = {
  orderId: string;
  receipt: ProfileOrderReceipt;
};

/**
 * Bloco de documentos do pedido: número do recibo emitido e as ações de baixar e enviar por e-mail.
 */
export function OrderDocumentsSection({ orderId, receipt }: OrderDocumentsSectionProps) {
  return (
    <ProfilePanel tone="white">
      <article className="flex flex-col gap-4 px-5 py-5">
        <ProfileSectionHeading>Documentos</ProfileSectionHeading>

        {receipt.number ? (
          <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
              Recibo
            </p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <code className="font-mono text-sm font-bold tracking-[0.1em] text-[#1a1a1a]">
                {receipt.number}
              </code>
              <OrderTrackingCopyButton label="Copiar número do recibo" value={receipt.number} />
            </div>
            {receipt.issuedAtLabel ? (
              <p className="mt-1.5 text-xs font-semibold text-[#1a1a1a]/60">
                Emitido em {receipt.issuedAtLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        {receipt.available ? (
          <OrderReceiptActions orderId={orderId} />
        ) : (
          <p className="text-xs font-semibold leading-5 text-[#1a1a1a]/65">
            O recibo fica disponível após a confirmação do pagamento.
          </p>
        )}
      </article>
    </ProfilePanel>
  );
}
