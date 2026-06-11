"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";

function formatExpiry(value?: string) {
  if (!value) return "Prazo nao informado";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function CheckoutPendingPayment({ initialOrder }: { initialOrder: ProfileOrderDetail }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [copyFeedback, setCopyFeedback] = useState("");

  useEffect(() => {
    const poll = window.setInterval(async () => {
      const response = await fetch(`/api/profile/orders/${order.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const nextOrder = (await response.json().catch(() => null)) as ProfileOrderDetail | null;

      if (!nextOrder) {
        return;
      }

      setOrder(nextOrder);

      if (nextOrder.payment.state === "paid") {
        router.replace(`/checkout/sucesso/${nextOrder.id}`);
      }
    }, 5000);

    return () => {
      window.clearInterval(poll);
    };
  }, [order.id, router]);

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyFeedback("Copiado.");
    window.setTimeout(() => setCopyFeedback(""), 1500);
  }

  return (
    <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
      <span className="inline-flex rounded-full bg-brand-yellow/25 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-brand-dark">
        Pagamento pendente
      </span>

      <h1 className="mt-5 text-[32px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
        Pedido {order.orderNumber}
      </h1>

      <p className="mt-3 text-sm leading-6 text-text-secondary">
        Assim que o pagamento for confirmado, esta pagina atualiza automaticamente.
      </p>

      {order.payment.pix ? (
        <div className="mt-8 rounded-[20px] border border-[#E5E7EB] bg-bg-light p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-dark">Pix</p>
          <p className="mt-2 text-sm text-text-secondary">
            Expira em {formatExpiry(order.payment.pix.expiresAt)}.
          </p>
          {order.payment.pix.qrCode ? (
            <div className="mt-4 break-all rounded-[14px] bg-white px-4 py-3 text-xs text-brand-dark">
              {order.payment.pix.qrCode}
            </div>
          ) : null}
          {order.payment.pix.copyPaste ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark">
                Copia e cola
              </p>
              <div className="mt-2 break-all rounded-[14px] bg-white px-4 py-3 text-xs text-brand-dark">
                {order.payment.pix.copyPaste}
              </div>
              <button
                className="mt-3 rounded-full bg-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-yellow"
                onClick={() => copyValue(order.payment.pix?.copyPaste || "")}
                type="button"
              >
                Copiar codigo
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {order.payment.boleto ? (
        <div className="mt-8 rounded-[20px] border border-[#E5E7EB] bg-bg-light p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-dark">Boleto</p>
          <p className="mt-2 text-sm text-text-secondary">
            Vencimento em {formatExpiry(order.payment.boleto.expiresAt)}.
          </p>
          {order.payment.boleto.line ? (
            <div className="mt-4 break-all rounded-[14px] bg-white px-4 py-3 text-xs text-brand-dark">
              {order.payment.boleto.line}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {order.payment.boleto.line ? (
              <button
                className="rounded-full bg-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-yellow"
                onClick={() => copyValue(order.payment.boleto?.line || "")}
                type="button"
              >
                Copiar linha
              </button>
            ) : null}
            {order.payment.boleto.url ? (
              <a
                className="rounded-full border border-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-dark"
                href={order.payment.boleto.url}
                rel="noreferrer"
                target="_blank"
              >
                Abrir boleto
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {copyFeedback ? <p className="mt-4 text-xs text-text-secondary">{copyFeedback}</p> : null}
    </div>
  );
}
