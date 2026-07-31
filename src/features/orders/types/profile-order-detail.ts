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
  locationLabel?: string;
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

export interface ProfileOrderShipment {
  code: string;
  deliveredAt: string;
  id: number;
  lastEventAt: string;
  lastEventDescription: string;
  lastEventLocation: string;
  status: string;
}

/**
 * Forma de pagamento usada no pedido.
 */
export interface ProfileOrderPaymentInfo {
  methodLabel: string;
  maskedLabel: string;
  state?: string;
  pix?: {
    qrCode?: string;
    qrCodeUrl?: string;
    copyPaste?: string;
    expiresAt?: string;
  };
  boleto?: {
    url?: string;
    line?: string;
    expiresAt?: string;
  };
}

/**
 * Recibo interno do pedido. `number` é nulo enquanto o recibo não foi emitido;
 * `available` é a decisão do WordPress sobre liberar o download.
 */
export interface ProfileOrderReceipt {
  number: string | null;
  available: boolean;
  issuedAtLabel: string | null;
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
  shipments: ProfileOrderShipment[];
  timeline: ProfileOrderTimelineEvent[];
  deliveryAddress: string;
  items: ProfileOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: ProfileOrderPaymentInfo;
  receipt: ProfileOrderReceipt;
}
