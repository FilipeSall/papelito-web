import type { ProfileOrderReceipt } from "@/features/orders";

import { OrderReceiptActions } from "./order-receipt-actions";
import { OrderTrackingCopyButton } from "./order-tracking-copy-button";

type OrderDocumentsSectionProps = {
  orderId: string;
  receipt: ProfileOrderReceipt;
};

export function OrderDocumentsSection({ orderId, receipt }: OrderDocumentsSectionProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-black uppercase tracking-[-0.3px] text-brand-dark">Documentos</h2>

      {receipt.number ? (
        <div className="mt-3 rounded-[14px] bg-bg-light px-4 py-3">
          <p className="text-xs text-gray-500">Recibo</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <code className="font-mono text-sm font-bold tracking-[1.4px] text-brand-dark">
              {receipt.number}
            </code>
            <OrderTrackingCopyButton label="Copiar número do recibo" value={receipt.number} />
          </div>
          {receipt.issuedAtLabel ? (
            <p className="mt-1 text-xs text-gray-400">Emitido em {receipt.issuedAtLabel}</p>
          ) : null}
        </div>
      ) : null}

      {receipt.available ? (
        <div className="mt-4">
          <OrderReceiptActions orderId={orderId} />
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-500">
          O recibo fica disponível após a confirmação do pagamento.
        </p>
      )}
    </article>
  );
}
