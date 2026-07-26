import Link from "next/link";

import { OrderStatus, OrderStatusBadge } from "./order-status-badge";

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  date: string;
  itemsCount: number;
  trackingCode?: string | null;
  total: number;
};

type OrderCardProps = {
  order: Order;
};

/**
 * Card de pedido individual.
 * Exibe informações resumidas do pedido com botão para ver detalhes.
 */
export function OrderCard({ order }: OrderCardProps) {
  const formattedTotal = order.total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const itemsLabel = order.itemsCount === 1 ? "item" : "itens";

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white px-6 py-6 shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_rgba(0,0,0,0.1)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-base font-black tracking-[-0.31px] text-brand-dark">
            {order.orderNumber}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
        <span className="text-sm font-normal tracking-[-0.15px] text-gray-400">
          {order.date}
        </span>
        <span className="text-sm font-normal tracking-[-0.15px] text-gray-500">
          {order.itemsCount} {itemsLabel}
        </span>
        {order.trackingCode ? <code className="text-xs font-bold tracking-[0.08em] text-brand-dark">Rastreio: {order.trackingCode}</code> : null}
      </div>

      <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
        <span className="text-base font-black tracking-[-0.44px] text-brand-dark sm:text-lg">
          {formattedTotal}
        </span>
        {order.status === "awaiting_payment" ? (
          <Link
            className="inline-flex h-8 shrink-0 items-center rounded-full bg-brand-yellow px-4 text-[10px] font-black uppercase tracking-[0.2px] text-brand-dark transition hover:opacity-90"
            href={`/checkout/pagamento/${order.id}`}
          >
            Concluir pagamento
          </Link>
        ) : null}
        <Link
          className="inline-flex h-8 shrink-0 items-center rounded-full bg-brand-dark px-4 text-[10px] font-black uppercase tracking-[0.2px] text-white transition hover:opacity-90"
          href={`/perfil/pedidos/${order.id}`}
        >
          Ver Detalhes
        </Link>
      </div>
    </article>
  );
}
