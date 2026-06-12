import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getProfileOrderDetail } from "@/features/orders";
import {
  formatPaymentDeadline,
  getPaymentExpiresAt,
} from "@/features/orders/utils/payment-deadline";
import {
  OrderStatusBadge,
  OrderTrackingCopyButton,
} from "@/components/layout/profile-page";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currentTimestamp() {
  return Date.now();
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/entrar");
  }

  const { id } = await params;
  const order = await getProfileOrderDetail(id);

  if (!order) {
    notFound();
  }

  const awaitingPayment = order.status === "awaiting_payment";
  const paymentDeadline = awaitingPayment
    ? formatPaymentDeadline(getPaymentExpiresAt(order.payment), currentTimestamp())
    : null;

  return (
    <section className="bg-bg-light">
      <div className="bg-brand-dark">
        <div className="mx-auto w-full max-w-391 px-8 py-5">
          <Link
            className="inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
            href="/perfil"
          >
            <svg
              aria-hidden
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar aos pedidos
          </Link>

          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-black leading-8 tracking-[0.07px] text-white">
                Pedido {order.orderNumber}
              </h1>
              <p className="mt-2 text-sm text-white/50">
                {order.dateLabel} · {order.storeLabel}
              </p>
            </div>

            <div className="pt-1">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-391 px-8 py-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[632px_308px]">
          <div className="space-y-5">
            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-dark">
                  <svg
                    aria-hidden
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 7V3m8 4V3M4 11h16M7 15h.01M12 15h.01M17 15h.01M7 19h.01M12 19h.01M17 19h.01M6 5h12a2 2 0 012 2v14H4V7a2 2 0 012-2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-black text-brand-dark">Código de Rastreamento</p>
                  <p className="text-xs text-gray-400">{order.tracking?.carrier ?? "Aguardando informacao do vendor"}</p>
                </div>
              </div>

              {order.tracking ? (
                <div className="mt-4 flex items-center justify-between rounded-[14px] bg-bg-light px-4 py-3">
                  <code className="font-mono text-sm font-bold tracking-[1.4px] text-brand-dark">
                    {order.tracking.code}
                  </code>
                  <OrderTrackingCopyButton code={order.tracking.code} />
                </div>
              ) : (
                <p className="mt-4 rounded-[14px] bg-bg-light px-4 py-3 text-sm text-gray-500">
                  Codigo de rastreamento ainda nao informado.
                </p>
              )}

              {order.tracking ? <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <svg
                  aria-hidden
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Previsão de entrega:
                <span className="font-bold text-brand-dark">{order.tracking.estimatedDeliveryLabel}</span>
              </p> : null}
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-base font-black uppercase tracking-[-0.3px] text-brand-dark">
                Histórico do Pedido
              </h2>

              <div className="relative mt-6">
                <div className="absolute left-[17px] top-4 h-[calc(100%-32px)] w-px bg-gray-100" />
                <div className="space-y-6">
                  {order.timeline.map((event) => {
                    const isDone = event.state === "done";
                    const isCurrent = event.state === "current";

                    return (
                      <div className="relative flex gap-4" key={event.id}>
                        <span
                          className={`relative z-10 mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full ${
                            isDone
                              ? "bg-green-100 text-green-600"
                              : isCurrent
                                ? "bg-brand-yellow text-brand-dark"
                                : "bg-gray-100 text-gray-300"
                          }`}
                        >
                          {isDone ? (
                            <svg
                              aria-hidden
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M5 13l4 4L19 7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : isCurrent ? (
                            <svg
                              aria-hidden
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M3 7h13l4 4v6h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3V7z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <span className="size-2 rounded-full bg-current" />
                          )}
                        </span>

                        <div className="pb-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-black ${
                                event.state === "pending" ? "text-gray-300" : "text-brand-dark"
                              }`}
                            >
                              {event.title}
                            </p>
                            {isCurrent && (
                              <span className="inline-flex rounded-full bg-brand-yellow px-2 py-0.5 text-[11px] font-black text-brand-dark">
                                Atual
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-1 text-xs ${
                              event.state === "pending" ? "text-gray-300" : "text-gray-500"
                            }`}
                          >
                            {event.description}
                          </p>
                          {event.timestampLabel ? (
                            <p
                              className={`mt-1 text-xs ${
                                event.state === "pending" ? "text-gray-300" : "text-gray-400"
                              }`}
                            >
                              {event.timestampLabel}
                            </p>
                          ) : null}
                          {event.expectedLabel && (
                            <p className="mt-1 text-xs font-semibold text-gray-400">
                              {event.expectedLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-base font-black uppercase tracking-[-0.3px] text-brand-dark">
                Endereço de Entrega
              </h2>
              <p className="mt-4 flex items-start gap-3 text-sm text-gray-500">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-dark">
                  <svg
                    aria-hidden
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 21s-7-5.33-7-11a7 7 0 1114 0c0 5.67-7 11-7 11zm0-8a3 3 0 100-6 3 3 0 000 6z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {order.deliveryAddress}
              </p>
            </article>
          </div>

          <aside className="space-y-4">
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-base font-black uppercase tracking-[-0.3px] text-brand-dark">
                Itens do Pedido
              </h2>

              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div className="flex items-start justify-between gap-3" key={item.id}>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{item.name}</p>
                      <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black text-brand-dark">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Frete</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between pt-1 text-lg font-black text-brand-dark">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-base font-black uppercase tracking-[-0.3px] text-brand-dark">
                Pagamento
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-dark text-white">
                  <svg
                    aria-hidden
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <rect height="14" rx="2" width="20" x="2" y="5" />
                    <path d="M2 10h20" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-black text-brand-dark">{order.payment.methodLabel}</p>
                  {order.payment.maskedLabel ? (
                    <p className="text-xs text-gray-400">{order.payment.maskedLabel}</p>
                  ) : null}
                </div>
              </div>

              {awaitingPayment ? (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {paymentDeadline?.expired ? (
                    <p className="text-xs font-semibold text-red-600">
                      Pagamento expirado. Faca um novo pedido para comprar estes itens.
                    </p>
                  ) : (
                    <>
                      <Link
                        className="inline-flex h-10 w-full items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:opacity-90"
                        href={`/checkout/pagamento/${order.id}`}
                      >
                        Concluir pagamento
                      </Link>
                      {paymentDeadline?.hasDeadline ? (
                        <p className="mt-2 text-center text-xs text-gray-500">{paymentDeadline.label}</p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </article>

            <article className="rounded-2xl bg-brand-yellow p-5">
              <p className="text-base font-black text-brand-dark">{order.storeLabel}</p>
              <p className="mt-1 text-xs text-brand-dark/80">Duvidas sobre o pedido?</p>
              <Link
                className="mt-4 inline-flex h-9 items-center rounded-full bg-brand-dark px-5 text-sm font-black text-white"
                href={`/perfil/pedidos/${order.id}/suporte`}
              >
                Falar com vendor
              </Link>
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
