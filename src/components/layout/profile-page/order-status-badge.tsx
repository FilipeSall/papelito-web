export type OrderStatus =
  | "awaiting_payment"
  | "stock_review"
  | "expired"
  | "awaiting_shipment"
  | "picking"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const statusConfig: Record<OrderStatus, { label: string; bgColor: string; textColor: string }> = {
  awaiting_payment: {
    label: "Aguardando pagamento",
    bgColor: "bg-gray-500/20",
    textColor: "text-gray-500",
  },
  stock_review: {
    label: "Pagamento em análise",
    bgColor: "bg-yellow-500/20",
    textColor: "text-yellow-700",
  },
  expired: {
    label: "Pagamento expirado",
    bgColor: "bg-red-500/20",
    textColor: "text-red-500",
  },
  delivered: {
    label: "Entregue",
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
  },
  shipped: {
    label: "Enviado",
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  picking: {
    label: "Em separação",
    bgColor: "bg-orange-500/20",
    textColor: "text-orange-600",
  },
  awaiting_shipment: {
    label: "Aguardando envio",
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
