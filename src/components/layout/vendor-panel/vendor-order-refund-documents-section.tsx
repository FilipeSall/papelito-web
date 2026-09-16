"use client";

import { Download, Eye, EyeOff, FileText, Paperclip, RotateCcw } from "lucide-react";
import { useState } from "react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import type { VendorOrderRefund } from "@/features/vendor-orders/types/vendor-orders";
import { parseUtcDate, SAO_PAULO } from "@/features/vendor-orders/utils/order-dates";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: SAO_PAULO,
});

function formatStamp(value: string): string {
  if (!value) return "";

  const date = parseUtcDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

const darkActionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-brand-yellow bg-transparent px-4 text-[10px] font-black uppercase tracking-[0.14em] text-brand-yellow transition hover:bg-brand-yellow hover:text-[#1a1a1a]",
  FOCUS_RING,
].join(" ");

const actionClassName = [
  "inline-flex h-10 cursor-pointer items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow",
  FOCUS_RING,
].join(" ");

/**
 * Documentos de um pedido estornado, na visão do vendor.
 *
 * Substitui a seção de documentos do pedido: com o dinheiro devolvido, o
 * recibo do pedido e a nota fiscal deixam de ser o documento vigente e saem
 * desta área. Nada é apagado — os dois continuam no banco e no storage, e o
 * recibo de estorno aponta para o recibo original pelo número.
 *
 * Quem decide a troca é o WordPress, em `documentsSurface`; esta seção só
 * apresenta o que sobrou.
 */
export function VendorOrderRefundDocumentsSection({
  orderId,
  refund,
}: {
  orderId: number;
  refund: VendorOrderRefund | null;
}) {
  // Diferente do recibo do pedido, gerar este PDF não emite documento nenhum:
  // o número do recibo de estorno é atribuído na conclusão do estorno. Ainda
  // assim o frame só monta quando o vendor pede, para a página não baixar um
  // PDF que ninguém abriu.
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const issued = refund?.status === "reembolsado" && Boolean(refund.receiptNumber);
  const proofId = refund?.proofId ?? 0;

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <h2 className="border-b-2 border-[#1a1a1a] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
        Documentos do estorno
      </h2>

      <div className="space-y-4 px-5 py-5 md:px-6">
        <section className="border-2 border-[#1a1a1a] bg-white">
          <div className="flex flex-col gap-4 border-b-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center border-2 border-brand-yellow bg-brand-yellow text-[#1a1a1a]">
                <FileText aria-hidden className="size-6" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-yellow">
                  Recibo de estorno
                </p>
                {issued ? (
                  <p className="mt-1 truncate font-mono text-lg font-bold tracking-wide text-white">
                    {refund?.receiptNumber}
                  </p>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-white/72">
                    Emitido quando o estorno for concluído
                  </p>
                )}
                {issued && formatStamp(refund?.settledAt ?? "") ? (
                  <p className="mt-0.5 text-xs tabular-nums text-white/60">
                    Estorno concluído em {formatStamp(refund?.settledAt ?? "")}
                  </p>
                ) : null}
              </div>
            </div>

            {issued ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  aria-expanded={open}
                  className={darkActionClassName}
                  onClick={() => {
                    setMounted(true);
                    setOpen(!open);
                  }}
                  type="button"
                >
                  {open ? (
                    <EyeOff aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  ) : (
                    <Eye aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  )}
                  {open ? "Fechar" : "Visualizar"}
                </button>
                <a
                  className={darkActionClassName}
                  href={`/api/vendor/orders/${orderId}/refund-receipt?download=1`}
                >
                  <Download aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Baixar PDF
                </a>
              </div>
            ) : (
              <span className="shrink-0">
                <StatusChip icon={RotateCcw} label="Estorno em andamento" tone="pending" />
              </span>
            )}
          </div>

          {issued ? (
            <div className="px-5 py-5">
              <div hidden={!open || !mounted}>
                {loaded ? null : (
                  <div
                    aria-live="polite"
                    className="flex h-40 items-center justify-center border-2 border-[#1a1a1a]/15 bg-[#faf8f2]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/55">
                      Carregando recibo de estorno…
                    </p>
                  </div>
                )}
                {mounted ? (
                  <iframe
                    className={`h-[70vh] min-h-96 w-full border-2 border-[#1a1a1a] bg-white ${loaded ? "" : "hidden"}`}
                    onLoad={() => setLoaded(true)}
                    src={`/api/vendor/orders/${orderId}/refund-receipt`}
                    title="Recibo de estorno"
                  />
                ) : null}
              </div>

              <p className="mt-3 text-xs leading-5 text-[#231f20]/62">
                Documento da Papelito com o valor devolvido ao comprador. É o mesmo que o comprador
                recebe, e traz o número do recibo do pedido que ele substitui.
              </p>
            </div>
          ) : (
            <p className="px-5 py-5 text-xs leading-5 text-[#231f20]/62">
              Este pedido foi estornado e os documentos do fluxo normal saíram desta área. O recibo
              de estorno aparece aqui assim que o estorno for concluído.
            </p>
          )}
        </section>

        {proofId > 0 ? (
          <section className="border-2 border-[#1a1a1a]/15 bg-white">
            <div className="flex flex-col gap-2 border-b-2 border-[#1a1a1a]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
                Comprovante da transferência
              </h3>
            </div>
            <div className="px-4 py-4">
              <a
                className={actionClassName}
                href={`/api/order-refunds/proofs/${proofId}`}
                rel="noreferrer"
                target="_blank"
              >
                <Paperclip aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                Ver comprovante
              </a>
            </div>
          </section>
        ) : null}

        <p className="text-xs leading-5 text-[#231f20]/62">
          O recibo do pedido e a nota fiscal deixaram esta área quando o estorno foi concluído. Os
          dois continuam guardados para histórico e auditoria — a devolução fiscal, quando couber, é
          emitida por você, por fora da Papelito.
        </p>
      </div>
    </section>
  );
}
