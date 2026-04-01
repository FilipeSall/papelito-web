export type OrderStatus = "delivered" | "in_transit" | "pending" | "cancelled";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const statusConfig: Record<OrderStatus, { label: string; bgColor: string; textColor: string }> = {
  delivered: {
    label: "Entregue",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
  },
  in_transit: {
    label: "Em trânsito",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  pending: {
    label: "Pendente",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-500",
  },
  cancelled: {
    label: "Cancelado",
    bgColor: "bg-red-500/20",
    textColor: "text-red-400",
  },
};

/**
 * Badge de status do pedido.
 * Exibe o status com cores correspondentes (verde, azul, amarelo, vermelho).
 */
export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}
