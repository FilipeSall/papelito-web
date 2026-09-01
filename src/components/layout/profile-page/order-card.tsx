import Link from "next/link";

import { ProfilePanel, profilePrimaryActionClass, profileSecondaryActionClass } from "./profile-panel";
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
 * Cartão de um pedido na lista da conta.
 * Traz identificação, situação, total e a próxima ação disponível para o comprador.
 */
export function OrderCard({ order }: OrderCardProps) {
  const formattedTotal = order.total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const itemsLabel = order.itemsCount === 1 ? "item" : "itens";
  const needsPayment = order.status === "awaiting_payment";

  return (
    <ProfilePanel tone="white">
      <article className="flex flex-col gap-5 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-lg font-black uppercase tracking-tight text-[#1a1a1a]">
              {order.orderNumber}
            </span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]/55">
            {order.date} · {order.itemsCount} {itemsLabel}
          </p>
          {order.trackingCode ? (
            <p className="text-xs font-bold tracking-[0.08em] text-[#1a1a1a]/75">
              Rastreio {order.trackingCode}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <span className="text-2xl font-black uppercase tracking-tight text-[#1a1a1a] tabular-nums">
            {formattedTotal}
          </span>
          <div className="flex flex-wrap gap-3">
            {needsPayment ? (
              <Link className={profilePrimaryActionClass} href={`/checkout/pagamento/${order.id}`}>
                Concluir pagamento
              </Link>
            ) : null}
            <Link
              className={needsPayment ? profileSecondaryActionClass : profilePrimaryActionClass}
              href={`/perfil/pedidos/${order.id}`}
            >
              Ver detalhes
            </Link>
          </div>
        </div>
      </article>
    </ProfilePanel>
  );
}
