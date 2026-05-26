import type { OrderStatus } from "@/components/layout/profile-page/order-status-badge";

/**
 * Item de produto dentro de um pedido.
 */
export interface ProfileOrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Evento da linha do tempo de rastreamento do pedido.
 */
export interface ProfileOrderTimelineEvent {
  id: string;
  title: string;
  description: string;
  timestampLabel?: string;
  state: "done" | "current" | "pending";
  expectedLabel?: string;
}

/**
 * Informações de rastreio do pedido.
 */
export interface ProfileOrderTrackingInfo {
  carrier: string;
  code: string;
  estimatedDeliveryLabel: string;
}

/**
 * Forma de pagamento usada no pedido.
 */
export interface ProfileOrderPaymentInfo {
  methodLabel: string;
  maskedLabel: string;
}

/**
 * Dados de detalhe exibidos na página de pedido.
 */
export interface ProfileOrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  dateLabel: string;
  storeLabel: string;
  tracking: ProfileOrderTrackingInfo | null;
  timeline: ProfileOrderTimelineEvent[];
  deliveryAddress: string;
  items: ProfileOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: ProfileOrderPaymentInfo;
}
