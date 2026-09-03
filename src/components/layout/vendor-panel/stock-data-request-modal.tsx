"use client";

import { useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";

import { BaseModal } from "@/components/ui/base-modal";
import { FOCUS_RING } from "@/components/layout/operational-panel";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

import { FeedbackBanner, type FeedbackState } from "./feedback-banner";
import {
  buildWhatsappHref,
  describeMissingFields,
  missingFieldIcon,
  missingFieldLabel,
} from "./stock-status";

/**
 * Pedido de cadastro à Papelito.
 *
 * O que falta não é escolhido aqui: a lista vem da auditoria do WordPress e o servidor a
 * recalcula ao receber o pedido. O campo livre é recado, não declaração de campo faltante.
 */
export function StockDataRequestModal({
  contactPhone,
  item,
  onClose,
  onSent,
}: {
  contactPhone: string;
  item: VendorStockItem | null;
  onClose: () => void;
  onSent: (productId: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [sending, setSending] = useState(false);

  const whatsappHref = item
    ? buildWhatsappHref(contactPhone, item.productName, item.missingFields)
    : null;

  async function submit() {
    if (!item) return;

    setSending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/vendor/stock/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, product_id: item.productId }),
      });
      const data = (await response.json().catch(() => null)) as
        | { already_pending?: boolean; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.message ?? "Não foi possível enviar a solicitação.");
      }

      onSent(item.productId);
      setMessage("");
      onClose();
      setFeedback(null);
    } catch (error) {
      setFeedback({
        error: true,
        message:
          error instanceof Error ? error.message : "Não foi possível enviar a solicitação.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <BaseModal
      ariaLabelledBy="stock-data-request-title"
      contentClassName="w-full max-w-xl"
      onClose={onClose}
      open={Boolean(item)}
    >
      <div className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div aria-hidden className="h-2 w-full bg-brand-yellow" />
        <div className="border-b-2 border-[#1a1a1a] px-5 py-4">
          <h2
            className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]"
            id="stock-data-request-title"
          >
            Solicitar dados à Papelito
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#231f20]/70">
            {item ? item.productName : ""}
          </p>
        </div>

        {item ? (
          <div className="space-y-4 px-5 py-5">
            <FeedbackBanner feedback={feedback} />

            <div className="border-2 border-dashed border-[#c0392b]/55 bg-[#f7e6e2]/55 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7a3428]">
                Faltando {describeMissingFields(item.missingFields)}
              </p>
              <ul className="mt-2 space-y-1.5">
                {item.missingFields.map((field) => {
                  const Icon = missingFieldIcon(field);

                  return (
                    <li
                      className="flex items-center gap-2 text-sm font-semibold text-[#7a3428]"
                      key={field}
                    >
                      <Icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                      {missingFieldLabel(field)}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-2">
              <label
                className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]"
                htmlFor="stock-data-request-message"
              >
                Recado (opcional)
              </label>
              <textarea
                className={[
                  "min-h-24 w-full border-2 border-[#1a1a1a] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none placeholder:text-[#1a1a1a]/40",
                  FOCUS_RING,
                ].join(" ")}
                id="stock-data-request-message"
                maxLength={500}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ex.: tenho 40 unidades paradas esperando o peso."
                value={message}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t-2 border-[#1a1a1a] pt-4">
              <button
                className={[
                  "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
                  FOCUS_RING,
                ].join(" ")}
                disabled={sending}
                onClick={submit}
                type="button"
              >
                {sending ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                ) : (
                  <Send aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                )}
                {sending ? "Enviando…" : "Enviar solicitação"}
              </button>

              {whatsappHref ? (
                <a
                  className={[
                    "inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow",
                    FOCUS_RING,
                  ].join(" ")}
                  href={whatsappHref}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <MessageCircle aria-hidden className="h-4 w-4" strokeWidth={2.4} />
                  Falar no WhatsApp
                </a>
              ) : (
                <p className="text-xs leading-5 text-[#231f20]/64">
                  Sem telefone de atendimento cadastrado. A solicitação acima chega igual à
                  Papelito.
                </p>
              )}

              <button
                className={[
                  "ml-auto inline-flex h-11 items-center px-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition hover:text-[#1a1a1a]",
                  FOCUS_RING,
                ].join(" ")}
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
}
