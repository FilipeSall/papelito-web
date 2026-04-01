import Link from "next/link";

import { OrderStatus, OrderStatusBadge } from "./order-status-badge";

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  date: string;
  itemsCount: number;
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
    <article className="flex items-center justify-between rounded-2xl bg-white px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
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
      </div>

      <div className="flex items-center gap-4">
        <span className="text-lg font-black tracking-[-0.44px] text-brand-dark">
          {formattedTotal}
        </span>
        <Link
          className="inline-flex h-8 items-center rounded-full bg-brand-dark px-4 text-xs font-black text-white transition hover:opacity-90"
          href={`/perfil/pedidos/${order.id}`}
        >
          Ver Detalhes
        </Link>
      </div>
    </article>
  );
}
