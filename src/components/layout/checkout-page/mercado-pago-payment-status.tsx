import Link from "next/link";

import type { ProfileOrderDetail } from "@/features/orders/types/profile-order-detail";

import { ExternalLinkIcon } from "./checkout-icons";
import { CheckoutStatusHeader } from "./checkout-status-header";
import { OrderPaymentSummary } from "./order-payment-summary";
import { PaymentSectionTitle } from "./payment-method-panel";

type MercadoPagoStatusKind = "waiting" | "paid" | "failed" | "refunded";

type StatusCopy = {
  badge: string;
  title: string;
  body: string;
  headerDescription: string;
  tone: "brand" | "danger";
};

const STATUS_COPY: Record<MercadoPagoStatusKind, StatusCopy> = {
  waiting: {
    badge: "Pagamento pendente",
    title: "Aguardando o Mercado Pago",
    body: "Estamos confirmando seu pagamento com o Mercado Pago. Assim que ele for confirmado, esta página atualiza sozinha — não é preciso refazer o pedido.",
    headerDescription: "Falta só a confirmação do pagamento.",
    tone: "brand",
  },
  paid: {
    badge: "Pagamento confirmado",
    title: "Pagamento confirmado",
    body: "O Mercado Pago confirmou o pagamento. Abrindo a confirmação do pedido...",
    headerDescription: "Pagamento confirmado.",
    tone: "brand",
  },
  failed: {
    badge: "Pagamento não aprovado",
    title: "Pagamento não aprovado",
    body: "O Mercado Pago não aprovou o pagamento deste pedido e ele não será processado. Faça um novo pedido para comprar estes itens.",
    headerDescription: "Este pedido não será processado.",
    tone: "danger",
  },
  refunded: {
    badge: "Pagamento estornado",
    title: "Pagamento estornado",
    body: "O pagamento deste pedido foi estornado pelo Mercado Pago. Acompanhe os detalhes em Meus pedidos.",
    headerDescription: "O valor foi devolvido.",
    tone: "danger",
  },
};

const FAILED_STATES = new Set(["failed", "expired"]);

function statusKind(state: string | undefined): MercadoPagoStatusKind {
  if (state === "paid" || state === "captured") return "paid";
  if (state === "refunded") return "refunded";
  if (FAILED_STATES.has(state ?? "")) return "failed";

  return "waiting";
}

const OUTLINE_LINK_CLASS =
  "inline-flex h-12 items-center justify-center rounded-full border border-brand-dark px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-dark transition hover:bg-brand-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";
const PRIMARY_LINK_CLASS =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-yellow px-6 text-sm font-black uppercase tracking-[0.14em] text-brand-dark transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark";

type StatusActionsProps = {
  kind: MercadoPagoStatusKind;
  redirectUrl?: string;
};

function StatusActions({ kind, redirectUrl }: Readonly<StatusActionsProps>) {
  if (kind === "paid") return null;

  if (kind === "waiting") {
    if (!redirectUrl) return null;

    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a className={PRIMARY_LINK_CLASS} href={redirectUrl} rel="noopener noreferrer">
          <ExternalLinkIcon />
          Voltar ao Mercado Pago
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link className={PRIMARY_LINK_CLASS} href="/produtos">
        Voltar a comprar
      </Link>
      <Link className={OUTLINE_LINK_CLASS} href="/perfil">
        Meus pedidos
      </Link>
    </div>
  );
}

type MercadoPagoPaymentStatusProps = {
  order: ProfileOrderDetail;
};

/**
 * Situação de um pedido pago pelo Checkout Pro, sempre a partir do estado que o servidor
 * devolveu — a query de retorno do Mercado Pago (`status=approved`) nunca entra aqui. Só
 * `paid` confirma; pendente e desconhecido aguardam a reconciliação, com volta ao link se houver.
 */
export function MercadoPagoPaymentStatus({ order }: Readonly<MercadoPagoPaymentStatusProps>) {
  const kind = statusKind(order.payment.state);
  const copy = STATUS_COPY[kind];

  return (
    <main className="bg-bg-light">
      <CheckoutStatusHeader
        description={copy.headerDescription}
        supraLabel="Pedido realizado"
        title={`Pedido ${order.orderNumber}`}
        tone={copy.tone}
      />

      <section className="mx-auto w-full max-w-391 px-6 pb-16 pt-8 md:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,368px)]">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PaymentSectionTitle>{copy.title}</PaymentSectionTitle>
              <span className="inline-flex rounded-full bg-brand-yellow/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-dark">
                {copy.badge}
              </span>
            </div>

            <p aria-live="polite" className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              {copy.body}
            </p>

            <StatusActions kind={kind} redirectUrl={order.payment.redirectUrl} />
          </div>

          <OrderPaymentSummary order={order} />
        </div>
      </section>
    </main>
  );
}
