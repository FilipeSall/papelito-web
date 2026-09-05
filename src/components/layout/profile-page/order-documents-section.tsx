import { Download } from "lucide-react";

import type { ProfileOrderFiscalDocument, ProfileOrderReceipt } from "@/features/orders";

import { OrderReceiptActions } from "./order-receipt-actions";
import { OrderTrackingCopyButton } from "./order-tracking-copy-button";
import { ProfilePanel, ProfileSectionHeading } from "./profile-panel";

type OrderDocumentsSectionProps = {
  fiscalDocument: ProfileOrderFiscalDocument | null;
  orderId: string;
  receipt: ProfileOrderReceipt;
};

const FISCAL_ROLE_LABEL: Record<string, string> = {
  danfe_pdf: "DANFE em PDF",
  xml: "XML da NF-e",
};

function fiscalRoleLabel(role: string): string {
  return FISCAL_ROLE_LABEL[role] ?? "Arquivo da nota";
}

function formatAccessKey(key: string): string {
  return key ? (key.match(/.{1,4}/g) ?? [key]).join(" ") : "";
}

/**
 * Documentos do pedido: recibo e, quando o vendor anexou, a nota fiscal.
 *
 * A ausência de nota **não é comunicada**. Sem nota, o bloco simplesmente não
 * existe: quem emite é o vendor, e avisar o comprador de uma pendência que não
 * é dele só geraria dúvida sobre a compra.
 */
export function OrderDocumentsSection({
  fiscalDocument,
  orderId,
  receipt,
}: OrderDocumentsSectionProps) {
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

        {fiscalDocument ? (
          <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
              Nota fiscal
            </p>
            {fiscalDocument.docNumber ? (
              <p className="mt-1.5 font-mono text-sm font-bold tracking-[0.1em] text-[#1a1a1a]">
                Nº {fiscalDocument.docNumber}
                {fiscalDocument.docSeries ? ` / ${fiscalDocument.docSeries}` : ""}
              </p>
            ) : null}
            {fiscalDocument.accessKey ? (
              <p className="mt-1.5 break-all font-mono text-[11px] leading-4 text-[#1a1a1a]/65">
                {formatAccessKey(fiscalDocument.accessKey)}
              </p>
            ) : null}
            <ul className="mt-3 flex flex-wrap gap-2">
              {fiscalDocument.files.map((file) => (
                <li key={file.id}>
                  <a
                    className="inline-flex h-10 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                    href={`/api/perfil/pedidos/${orderId}/nota-fiscal/${file.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                    {fiscalRoleLabel(file.role)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
    </ProfilePanel>
  );
}
