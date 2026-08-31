"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

import { useCartStore } from "@/features/cart/store/use-cart-store";
import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";
import {
  formatPaymentDeadline,
  getPaymentExpiresAt,
  isPaymentExpired,
} from "@/features/orders/utils/payment-deadline";

const POLLING_INTERVAL_MS = 5000;
const DEADLINE_TICK_MS = 1000;
const CONFIRMED_PAYMENT_STATES = new Set(["paid", "captured"]);
const PENDING_PAYMENT_STATES = new Set(["", "pending", "waiting_payment", "awaiting_payment", "processing"]);

function formatExpiry(value?: string) {
  if (!value) return "Prazo não informado";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date);
}

function isHttpUrl(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function isPendingPaymentState(value?: string) {
  return PENDING_PAYMENT_STATES.has(value || "");
}

export function CheckoutPendingPayment({ initialOrder }: { initialOrder: ProfileOrderDetail }) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [order, setOrder] = useState(initialOrder);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [pixQrImage, setPixQrImage] = useState({ code: "", dataUrl: "" });
  const [nowMs, setNowMs] = useState(() => Date.now());

  const paymentState = order.payment.state || "";
  const hasAsyncPayment = Boolean(order.payment.pix || order.payment.boleto);
  const expiresAt = getPaymentExpiresAt(order.payment);
  const expired = isPaymentExpired(expiresAt, nowMs);
  const deadline = formatPaymentDeadline(expiresAt, nowMs);
  const shouldPollPayment = hasAsyncPayment && !expired && isPendingPaymentState(paymentState);
  const pixCode = order.payment.pix?.copyPaste || (!isHttpUrl(order.payment.pix?.qrCode) ? order.payment.pix?.qrCode : "");
  const pixQrDataUrl = pixQrImage.code === pixCode ? pixQrImage.dataUrl : "";
  const pixQrImageSrc =
    pixQrDataUrl || order.payment.pix?.qrCodeUrl || (isHttpUrl(order.payment.pix?.qrCode) ? order.payment.pix?.qrCode : "");

  useEffect(() => {
    if (CONFIRMED_PAYMENT_STATES.has(paymentState)) {
      clearCart();
      router.replace(`/checkout/sucesso/${order.id}`);
      return;
    }

    if (!shouldPollPayment) {
      return;
    }

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

      const state = nextOrder.payment.state;
      if (state === "paid" || state === "captured") {
        clearCart();
        router.replace(`/checkout/sucesso/${nextOrder.id}`);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(poll);
    };
  }, [order.id, paymentState, router, clearCart, shouldPollPayment]);

  useEffect(() => {
    if (!deadline.hasDeadline || expired) {
      return;
    }

    const tick = window.setInterval(() => {
      setNowMs(Date.now());
    }, DEADLINE_TICK_MS);

    return () => {
      window.clearInterval(tick);
    };
  }, [deadline.hasDeadline, expired]);

  useEffect(() => {
    let cancelled = false;

    if (!pixCode) {
      return;
    }

    QRCode.toDataURL(pixCode, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
      color: {
        dark: "#15111A",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setPixQrImage({ code: pixCode, dataUrl });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPixQrImage({ code: pixCode, dataUrl: "" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pixCode]);

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    setCopyFeedback("Copiado.");
    window.setTimeout(() => setCopyFeedback(""), 1500);
  }

  if (expired) {
    return (
      <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]">
        <span className="inline-flex rounded-full bg-red-100 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-700">
          Pagamento expirado
        </span>

        <h1 className="mt-5 text-[32px] font-black uppercase tracking-[-0.4492px] text-brand-dark">
          Pedido {order.orderNumber}
        </h1>

        <p className="mt-3 text-sm leading-6 text-text-secondary">
          O prazo para pagar este pedido expirou. Faca um novo pedido para comprar estes itens.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-dark px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-yellow"
            href="/produtos"
          >
            Voltar a comprar
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-dark px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-dark"
            href="/perfil"
          >
            Meus pedidos
          </Link>
        </div>
      </div>
    );
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
        Assim que o pagamento for confirmado, esta página atualiza automaticamente.
      </p>

      {deadline.hasDeadline ? (
        <p className="mt-2 text-sm font-semibold text-brand-dark">{deadline.label}</p>
      ) : null}

      {order.payment.pix ? (
        <div className="mt-8 rounded-[20px] border border-[#E5E7EB] bg-bg-light p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-dark">Pix</p>
          <p className="mt-2 text-sm text-text-secondary">
            Expira em {formatExpiry(order.payment.pix.expiresAt)}.
          </p>
          {pixQrImageSrc ? (
            <div className="mt-4 inline-flex rounded-[18px] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR Code Pix para pagamento"
                className="h-60 w-60 rounded-[10px]"
                height={240}
                src={pixQrImageSrc}
                width={240}
              />
            </div>
          ) : (
            <p className="mt-4 rounded-[14px] bg-white px-4 py-3 text-sm text-text-secondary">
              QR Code indisponível. Use o código copia e cola abaixo.
            </p>
          )}
          {pixCode ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-dark">
                Copia e cola
              </p>
              <div className="mt-2 break-all rounded-[14px] bg-white px-4 py-3 text-xs text-brand-dark">
                {pixCode}
              </div>
              <button
                className="mt-3 rounded-full bg-brand-dark px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-brand-yellow"
                onClick={() => copyValue(pixCode)}
                type="button"
              >
                Copiar código
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
