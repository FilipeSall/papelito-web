"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

import { useCartStore } from "@/features/cart/store/use-cart-store";
import { useCheckoutStore } from "@/features/checkout";
import type { PendingPaymentAttempt } from "@/features/checkout/types/checkout";
import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";
import { useIsMounted } from "@/hooks/use-is-mounted";
import {
  formatPaymentDeadline,
  getPaymentExpiresAt,
  isPaymentExpired,
} from "@/features/orders/utils/payment-deadline";

import { BarcodeIcon, ExternalLinkIcon, QrCodeIcon } from "./checkout-icons";
import {
  PaymentActions,
  PaymentCodeBlock,
  PaymentDigitableLine,
  PaymentMethodPanel,
  PaymentPlaque,
  PaymentSectionTitle,
  PaymentSteps,
} from "./payment-method-panel";
import { CheckoutPaymentContinuation } from "./checkout-payment-continuation";
import { CheckoutStatusAside, CheckoutStatusHeader } from "./checkout-status-header";
import { MercadoPagoPaymentStatus } from "./mercado-pago-payment-status";
import { OrderPaymentSummary } from "./order-payment-summary";

const POLLING_INTERVAL_MS = 5000;
const DEADLINE_TICK_MS = 1000;
const CONFIRMED_PAYMENT_STATES = new Set(["paid", "captured"]);
const PENDING_PAYMENT_STATES = new Set(["", "pending", "unknown", "waiting_payment", "awaiting_payment", "processing"]);

const PIX_STEPS = [
  "Abra o aplicativo do seu banco e entre na área Pix.",
  "Escolha pagar com QR Code e aponte a câmera, ou use a opção Pix copia e cola.",
  "Confira o valor e confirme. A confirmação chega em segundos.",
];

const BOLETO_STEPS = [
  "Copie a linha digitável ou baixe o boleto em PDF.",
  "Pague no aplicativo do seu banco, em uma lotérica ou no internet banking.",
  "A compensação bancária leva até 3 dias úteis para ser confirmada.",
];

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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isPendingPaymentState(value?: string) {
  return PENDING_PAYMENT_STATES.has(value || "");
}

async function fetchOrder(orderId: string): Promise<ProfileOrderDetail | null> {
  try {
    const response = await fetch(`/api/profile/orders/${orderId}`, { cache: "no-store" });

    if (!response.ok) return null;

    return (await response.json().catch(() => null)) as ProfileOrderDetail | null;
  } catch {
    return null;
  }
}

function serverAttempt(order: ProfileOrderDetail): PendingPaymentAttempt | null {
  const { flow, state, paymentAttemptId, configurationVersion } = order.payment;

  if (flow !== "requires_payment_input" || state !== "awaiting_payment_input") return null;
  if (!paymentAttemptId || configurationVersion === undefined) return null;

  return { orderId: Number(order.id), paymentAttemptId, configurationVersion };
}

function storedAttempt(attempt: PendingPaymentAttempt | null, order: ProfileOrderDetail) {
  if (!attempt || String(attempt.orderId) !== order.id) return null;
  if (order.status !== "awaiting_payment" || order.payment.provider === "mercadopago") return null;
  if (typeof attempt.paymentAttemptId !== "number" || typeof attempt.configurationVersion !== "string") return null;

  return attempt;
}

/**
 * Tentativa aguardando coleta. Com o fluxo informado pelo servidor ele é a única fonte; o store
 * só acelera pedidos cujo detalhe ainda não traz o fluxo.
 */
function resolveAttempt(order: ProfileOrderDetail, stored: PendingPaymentAttempt | null) {
  if (order.payment.flow) return serverAttempt(order);

  return storedAttempt(stored, order);
}

type CheckoutPendingPaymentProps = {
  /** Pedido lido no servidor; uma nova leitura (router.refresh) substitui o estado local. */
  initialOrder: ProfileOrderDetail;
};

/**
 * Página de pagamento de um pedido criado. Com tentativa aguardando coleta (vinda do servidor,
 * em qualquer aparelho) mostra a coleta Pagar.me; no Mercado Pago mostra o estado do servidor; nos demais,
 * PIX/boleto de sempre. Em todos os casos só `paid` do servidor leva ao sucesso.
 */
export function CheckoutPendingPayment({ initialOrder }: Readonly<CheckoutPendingPaymentProps>) {
  const isMounted = useIsMounted();
  const pendingAttempt = useCheckoutStore((state) => state.pendingPaymentAttempt);
  const [order, setOrder] = useState(initialOrder);
  const [sourceOrder, setSourceOrder] = useState(initialOrder);

  if (sourceOrder !== initialOrder) {
    setSourceOrder(initialOrder);
    setOrder(initialOrder);
  }

  const attempt = resolveAttempt(order, isMounted ? pendingAttempt : null);

  if (attempt) {
    return <CheckoutPaymentContinuation key={attempt.paymentAttemptId} attempt={attempt} order={order} />;
  }

  return <PendingPaymentView order={order} onOrderChange={setOrder} />;
}

type PendingPaymentViewProps = {
  order: ProfileOrderDetail;
  onOrderChange: (order: ProfileOrderDetail) => void;
};

function PendingPaymentView({ order, onOrderChange }: Readonly<PendingPaymentViewProps>) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [pixQrImage, setPixQrImage] = useState({ code: "", dataUrl: "" });
  const [nowMs, setNowMs] = useState(() => Date.now());

  const paymentState = order.payment.state || "";
  const expiresAt = getPaymentExpiresAt(order.payment);
  const expired = isPaymentExpired(expiresAt, nowMs);
  const deadline = formatPaymentDeadline(expiresAt, nowMs);
  const isMercadoPago = order.payment.provider === "mercadopago";
  const awaitingInput = order.payment.flow === "requires_payment_input";
  const shouldPollPayment = !awaitingInput && !expired && isPendingPaymentState(paymentState);
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
      const nextOrder = await fetchOrder(order.id);

      if (!nextOrder) {
        return;
      }

      onOrderChange(nextOrder);

      const state = nextOrder.payment.state;
      if (state === "paid" || state === "captured") {
        clearCart();
        router.replace(`/checkout/sucesso/${nextOrder.id}`);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(poll);
    };
  }, [order.id, paymentState, router, clearCart, shouldPollPayment, onOrderChange]);

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
    try {
      await navigator.clipboard.writeText(value);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 2500);
  }

  const boletoLine = order.payment.boleto?.line || "";

  if (isMercadoPago) {
    return <MercadoPagoPaymentStatus order={order} />;
  }

  if (expired) {
    return (
      <main className="bg-bg-light">
        <CheckoutStatusHeader
          description="O prazo para pagar este pedido acabou e ele não será processado."
          supraLabel="Prazo encerrado"
          title={`Pedido ${order.orderNumber}`}
          tone="danger"
        />

        <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-8 md:px-8">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,368px)]">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] md:p-8">
              <span className="inline-flex rounded-full bg-[#FEF2F2] px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#B42318]">
                Pagamento expirado
              </span>

              <h2 className="mt-5 text-2xl font-black uppercase tracking-[-0.4492px] text-brand-dark">
                O prazo deste pedido acabou
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
                Este pedido não será processado. Faça um novo pedido para comprar estes itens — os
                preços e a disponibilidade são recalculados no checkout.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-full bg-brand-yellow px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-dark transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                  href="/produtos"
                >
                  Voltar a comprar
                </Link>
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-full border border-brand-dark px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                  href="/perfil"
                >
                  Meus pedidos
                </Link>
              </div>
            </div>

            <OrderPaymentSummary order={order} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-bg-light">
      <CheckoutStatusHeader
        aside={
          deadline.hasDeadline ? (
            <CheckoutStatusAside
              label="Prazo para pagamento"
              note={`Pague até ${deadline.absoluteLabel}`}
              value={capitalize(deadline.remainingLabel)}
            />
          ) : null
        }
        description="Falta só o pagamento. Assim que ele for confirmado, esta página atualiza sozinha."
        supraLabel="Pedido realizado"
        title={`Pedido ${order.orderNumber}`}
      />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-8 md:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,368px)]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PaymentSectionTitle>Como pagar</PaymentSectionTitle>
              <span className="inline-flex rounded-full bg-brand-yellow/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-dark">
                Pagamento pendente
              </span>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              Estamos aguardando a confirmação da instituição financeira. Você não precisa
              atualizar a página: assim que o pagamento cair, seguimos para a confirmação do pedido.
            </p>

            {order.payment.pix ? (
              <div className="mt-6">
                <PaymentMethodPanel
                  asideLabel={formatExpiry(order.payment.pix.expiresAt)}
                  asideTitle="Expira em"
                  icon={<QrCodeIcon />}
                  label="Pix"
                  sublabel="Pagamento em processamento"
                  plaque={
                    pixQrImageSrc ? (
                      <PaymentPlaque caption="Aponte a câmera do seu banco">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt="QR Code Pix para pagamento"
                          className="h-54 w-54"
                          height={240}
                          src={pixQrImageSrc}
                          width={240}
                        />
                      </PaymentPlaque>
                    ) : (
                      <PaymentPlaque caption="Use o código copia e cola">
                        <span className="flex h-54 w-54 items-center justify-center px-4 text-center text-xs leading-5 text-text-secondary">
                          QR Code indisponível no momento.
                        </span>
                      </PaymentPlaque>
                    )
                  }
                >
                  <PaymentSteps steps={PIX_STEPS} />

                  {pixCode ? (
                    <>
                      <PaymentCodeBlock label="Pix copia e cola" value={pixCode} />
                      <PaymentActions
                        copyLabel="Copiar código"
                        onCopy={() => copyValue(pixCode)}
                        state={copyState}
                      />
                    </>
                  ) : null}
                </PaymentMethodPanel>
              </div>
            ) : null}

            {order.payment.boleto ? (
              <div className="mt-6">
                <PaymentMethodPanel
                  asideLabel={formatExpiry(order.payment.boleto.expiresAt)}
                  asideTitle="Vencimento"
                  icon={<BarcodeIcon />}
                  label="Boleto bancário"
                  sublabel="Pagamento em processamento"
                  plaque={
                    <PaymentPlaque caption="Linha digitável" className="w-full max-w-75">
                      {boletoLine ? (
                        <PaymentDigitableLine value={boletoLine} />
                      ) : (
                        <span className="block w-full px-4 py-8 text-center text-xs leading-5 text-text-secondary">
                          Linha digitável indisponível. Abra o boleto para pagar.
                        </span>
                      )}
                    </PaymentPlaque>
                  }
                >
                  <PaymentSteps steps={BOLETO_STEPS} />

                  {boletoLine ? (
                    <PaymentActions
                      copyLabel="Copiar linha"
                      linkHref={order.payment.boleto.url}
                      linkIcon={<ExternalLinkIcon />}
                      linkLabel={order.payment.boleto.url ? "Abrir boleto" : undefined}
                      onCopy={() => copyValue(boletoLine)}
                      state={copyState}
                    />
                  ) : order.payment.boleto.url ? (
                    <a
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brand-dark px-6 text-xs font-black uppercase tracking-[0.14em] text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
                      href={order.payment.boleto.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLinkIcon />
                      Abrir boleto
                    </a>
                  ) : null}
                </PaymentMethodPanel>
              </div>
            ) : null}
          </div>

          <OrderPaymentSummary order={order} />
        </div>
      </section>
    </main>
  );
}
