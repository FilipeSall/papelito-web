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
  OrderDocumentsSection,
  OrderStatusBadge,
  OrderTrackingCopyButton,
  ProfilePageTitle,
  ProfilePanel,
  ProfileSectionHeading,
  profilePrimaryActionClass,
  profileSecondaryActionClass,
} from "@/components/layout/profile-page";
import { OrderStatusAutoRefresh } from "@/components/layout/order-status-auto-refresh";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

const CORREIOS_TRACKING_URL = "https://rastreamento.correios.com.br/app/index.php?objetos=";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currentTimestamp() {
  return Date.now();
}

function timelineMarkerClass(state: string) {
  if (state === "done") {
    return "border-[#1f6b3a] bg-[#1f6b3a] text-white";
  }

  if (state === "current") {
    return "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]";
  }

  return "border-[#1a1a1a]/25 bg-white text-[#1a1a1a]/35";
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    redirect("/entrar");
  }

  const { id } = await params;
  const order = await getProfileOrderDetail(id);

  if (!order) {
    notFound();
  }

  const awaitingPayment = order.status === "awaiting_payment";
  const expiredPayment = order.status === "expired";
  const paymentDeadline = awaitingPayment
    ? formatPaymentDeadline(getPaymentExpiresAt(order.payment), currentTimestamp())
    : null;

  return (
    <section className="flex flex-col gap-7">
      <OrderStatusAutoRefresh />

      <Link
        className="inline-flex w-fit items-center gap-2 border-b-2 border-transparent text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:border-[#1a1a1a] hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
        href="/perfil"
      >
        <svg
          aria-hidden
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar aos pedidos
      </Link>

      <ProfilePageTitle
        action={<OrderStatusBadge status={order.status} />}
        description={`${order.dateLabel} · ${order.storeLabel}`}
        title={`Pedido ${order.orderNumber}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          <ProfilePanel tone="white">
            <article className="flex flex-col gap-4 px-5 py-5 md:px-6">
              <div>
                <ProfileSectionHeading>Código de rastreamento</ProfileSectionHeading>
                <p className="mt-1.5 text-sm font-semibold text-[#1a1a1a]/70">
                  {order.tracking?.carrier ?? "Aguardando informação do vendor"}
                </p>
              </div>

              {order.tracking ? (
                <div className="flex items-center justify-between gap-3 border-2 border-[#1a1a1a] bg-[#faf8f2] px-4 py-3">
                  <code className="font-mono text-sm font-bold tracking-[0.1em] text-[#1a1a1a]">
                    {order.tracking.code}
                  </code>
                  <OrderTrackingCopyButton value={order.tracking.code} />
                </div>
              ) : (
                <p className="border-2 border-[#1a1a1a]/20 bg-[#faf8f2] px-4 py-3 text-sm font-semibold text-[#1a1a1a]/70">
                  Código de rastreamento ainda não informado.
                </p>
              )}

              {order.tracking ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a1a1a]/70">
                    Previsão de entrega{" "}
                    <span className="text-[#1a1a1a]">
                      {order.tracking.estimatedDeliveryLabel}
                    </span>
                  </p>

                  <a
                    className={`${profilePrimaryActionClass} w-fit`}
                    href={`${CORREIOS_TRACKING_URL}${encodeURIComponent(order.tracking.code)}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Acompanhar nos Correios
                  </a>
                </>
              ) : null}

              {order.shipments.length > 1 ? (
                <div aria-label="Pacotes deste pedido" className="flex flex-col gap-3">
                  {order.shipments.map((shipment, index) => (
                    <div className="border-2 border-[#1a1a1a]/20 px-4 py-3" key={shipment.id}>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">
                        Pacote {index + 1}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-3">
                        <code className="font-mono text-xs font-bold tracking-[0.1em] text-[#1a1a1a]">
                          {shipment.code}
                        </code>
                        <OrderTrackingCopyButton value={shipment.code} />
                      </div>
                      <a
                        className="mt-2 inline-flex text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
                        href={`${CORREIOS_TRACKING_URL}${encodeURIComponent(shipment.code)}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Acompanhar pacote nos Correios
                      </a>
                      {shipment.lastEventDescription ? (
                        <p className="mt-2 text-xs font-semibold text-[#1a1a1a]/70">
                          {shipment.lastEventDescription}
                          {shipment.lastEventLocation ? ` · ${shipment.lastEventLocation}` : ""}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          </ProfilePanel>

          <ProfilePanel tone="white">
            <article className="px-5 py-5 md:px-6">
              <ProfileSectionHeading>Histórico do pedido</ProfileSectionHeading>

              <div className="relative mt-6">
                <div
                  aria-hidden
                  className="absolute left-4.5 top-4 h-[calc(100%-32px)] w-0.5 bg-[#1a1a1a]/15"
                />
                <div className="flex flex-col gap-6">
                  {order.timeline.map((event) => {
                    const isDone = event.state === "done";
                    const isCurrent = event.state === "current";
                    const isPending = event.state === "pending";

                    return (
                      <div
                        aria-current={isCurrent ? "step" : undefined}
                        className="relative flex gap-4"
                        key={event.id}
                      >
                        <span
                          className={`relative z-10 mt-0.5 inline-flex size-9 shrink-0 items-center justify-center border-2 ${timelineMarkerClass(event.state)}`}
                        >
                          {isDone ? (
                            <svg
                              aria-hidden
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : isCurrent ? (
                            <svg
                              aria-hidden
                              className="size-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M3 7h13l4 4v6h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3V7z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <span aria-hidden className="size-2 rotate-45 bg-current" />
                          )}
                        </span>

                        <div className="min-w-0 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-sm font-black uppercase tracking-tight ${
                                isPending ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]"
                              }`}
                            >
                              {event.title}
                            </p>
                            {isCurrent ? (
                              <span className="inline-flex border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">
                                Atual
                              </span>
                            ) : null}
                          </div>
                          <p
                            className={`mt-1 text-xs font-semibold leading-5 ${
                              isPending ? "text-[#1a1a1a]/40" : "text-[#1a1a1a]/70"
                            }`}
                          >
                            {event.description}
                          </p>
                          {event.timestampLabel ? (
                            <p
                              className={`mt-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
                                isPending ? "text-[#1a1a1a]/35" : "text-[#1a1a1a]/55"
                              }`}
                            >
                              {event.timestampLabel}
                              {event.locationLabel ? ` · ${event.locationLabel}` : ""}
                            </p>
                          ) : null}
                          {event.expectedLabel ? (
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1a1a]/55">
                              {event.expectedLabel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          </ProfilePanel>

          <ProfilePanel tone="white">
            <article className="px-5 py-5 md:px-6">
              <ProfileSectionHeading>Endereço de entrega</ProfileSectionHeading>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#1a1a1a]/75">
                {order.deliveryAddress}
              </p>
            </article>
          </ProfilePanel>
        </div>

        <aside className="flex flex-col gap-6">
          <ProfilePanel tone="white">
            <article className="px-5 py-5">
              <ProfileSectionHeading>Itens do pedido</ProfileSectionHeading>

              <div className="mt-4 flex flex-col gap-3">
                {order.items.map((item) => (
                  <div className="flex items-start justify-between gap-3" key={item.id}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1a1a1a]">{item.name}</p>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/55">
                        Qtd {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-[#1a1a1a] tabular-nums">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <dl className="mt-5 flex flex-col gap-1.5 border-t-2 border-[#1a1a1a]/12 pt-4 text-sm">
                <div className="flex justify-between font-semibold text-[#1a1a1a]/70">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between font-semibold text-[#1a1a1a]/70">
                  <dt>Frete</dt>
                  <dd className="tabular-nums">{formatCurrency(order.shipping)}</dd>
                </div>
                <div className="mt-1 flex justify-between text-lg font-black uppercase tracking-tight text-[#1a1a1a]">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatCurrency(order.total)}</dd>
                </div>
              </dl>
            </article>
          </ProfilePanel>

          <ProfilePanel tone="white">
            <article className="px-5 py-5">
              <ProfileSectionHeading>Pagamento</ProfileSectionHeading>

              <p className="mt-3 text-sm font-black uppercase tracking-tight text-[#1a1a1a]">
                {order.payment.methodLabel}
              </p>
              {order.payment.maskedLabel ? (
                <p className="mt-1 font-mono text-xs font-bold tracking-[0.1em] text-[#1a1a1a]/70">
                  {order.payment.maskedLabel}
                </p>
              ) : null}

              {awaitingPayment || expiredPayment ? (
                <div className="mt-5 border-t-2 border-[#1a1a1a]/12 pt-4">
                  {expiredPayment || paymentDeadline?.expired ? (
                    <p className="text-xs font-bold leading-5 text-[#c0392b]">
                      ⚠ Pagamento expirado. Faça um novo pedido para comprar estes itens.
                    </p>
                  ) : (
                    <>
                      <Link
                        className={`${profilePrimaryActionClass} w-full`}
                        href={`/checkout/pagamento/${order.id}`}
                      >
                        Concluir pagamento
                      </Link>
                      {paymentDeadline?.hasDeadline ? (
                        <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a1a1a]/70">
                          {paymentDeadline.label}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </article>
          </ProfilePanel>

          <OrderDocumentsSection orderId={order.id} receipt={order.receipt} />

          <div className="border-2 border-[#1a1a1a] bg-brand-yellow p-5 shadow-[8px_8px_0px_#1a1a1a]">
            <p className="text-base font-black uppercase tracking-tight text-[#1a1a1a]">
              {order.storeLabel}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1a1a]/75">
              Dúvidas sobre o pedido?
            </p>
            <Link
              className={`${profileSecondaryActionClass} mt-4 w-full`}
              href={`/perfil/pedidos/${order.id}/suporte`}
            >
              Falar com vendor
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
