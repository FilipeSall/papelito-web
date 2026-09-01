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

const toneClass = {
  action: "border-[#1a1a1a] bg-brand-yellow text-[#1a1a1a]",
  danger: "border-[#c0392b] bg-white text-[#c0392b]",
  done: "border-[#1f6b3a] bg-[#1f6b3a] text-white",
  moving: "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow",
  waiting: "border-[#1a1a1a] bg-white text-[#1a1a1a]",
} as const;

const statusConfig: Record<OrderStatus, { label: string; tone: keyof typeof toneClass }> = {
  awaiting_payment: { label: "Aguardando pagamento", tone: "action" },
  stock_review: { label: "Pagamento em análise", tone: "moving" },
  expired: { label: "Pagamento expirado", tone: "danger" },
  awaiting_shipment: { label: "Aguardando envio", tone: "waiting" },
  picking: { label: "Em separação", tone: "moving" },
  shipped: { label: "Enviado", tone: "moving" },
  delivered: { label: "Entregue", tone: "done" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

/**
 * Etiqueta de situação do pedido.
 * O tom separa o que exige ação do comprador, o que está em curso e o que terminou.
 */
export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex h-6 items-center border-2 px-2.5 text-[10px] font-black uppercase tracking-[0.16em] ${toneClass[config.tone]}`}
    >
      {config.label}
    </span>
  );
}
