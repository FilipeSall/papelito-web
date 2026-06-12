import "server-only";

import { getServerSession } from "next-auth";

import type { Order } from "@/components/layout/profile-page/order-card";
import type { OrderStatus } from "@/components/layout/profile-page/order-status-badge";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import type { ProfileOrderDetail, ProfileOrderTimelineEvent } from "../types/profile-order-detail";
import type { ProfileOrdersSnapshot } from "../types/profile-orders";
import { getPaymentExpiresAt, isPaymentExpired } from "../utils/payment-deadline";

type WpProfileOrder = {
  created_at?: string;
  delivery_time_days?: number;
  id?: number;
  items?: Array<{ item_id?: number; name?: string; qty?: number; total?: number }>;
  items_count?: number;
  order_number?: string;
  payment_method?: string;
  shipping_address?: {
    address_1?: string;
    address_2?: string;
    city?: string;
    postcode?: string;
    state?: string;
  };
  shipping_service?: string;
  shipping_total?: number;
  subtotal?: number;
  total?: number;
  tracking_code?: string | null;
  vendor_name?: string;
  vendor_status?: string;
  phone?: string;
  payment?: {
    method?: string;
    state?: string;
    pix?: {
      qr_code?: string;
      qr_code_url?: string;
      copy_paste?: string;
      expires_at?: string;
    };
    boleto?: {
      url?: string;
      line?: string;
      expires_at?: string;
    };
  };
};

type WpProfileOrdersList = {
  items?: WpProfileOrder[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
};

export function mapStatus(status: string | undefined): OrderStatus {
  switch (status) {
    case "aguardando_envio":
      return "awaiting_shipment";
    case "em_separacao":
      return "picking";
    case "enviado":
      return "shipped";
    case "entregue":
      return "delivered";
    case "cancelado":
      return "cancelled";
    case "aguardando_pagamento":
    default:
      return "awaiting_payment";
  }
}

function paymentInfo(order: WpProfileOrder) {
  return {
    methodLabel: order.payment_method || "Pagamento nao informado",
    maskedLabel: "",
    state: order.payment?.state,
    pix: order.payment?.pix
      ? {
          qrCode: order.payment.pix.qr_code,
          qrCodeUrl: order.payment.pix.qr_code_url,
          copyPaste: order.payment.pix.copy_paste,
          expiresAt: order.payment.pix.expires_at,
        }
      : undefined,
    boleto: order.payment?.boleto
      ? {
          url: order.payment.boleto.url,
          line: order.payment.boleto.line,
          expiresAt: order.payment.boleto.expires_at,
        }
      : undefined,
  };
}

export function resolveStatus(order: WpProfileOrder, nowMs = Date.now()): OrderStatus {
  const status = mapStatus(order.vendor_status);

  if (status !== "awaiting_payment") {
    return status;
  }

  if (order.payment?.state === "expired") {
    return "expired";
  }

  return isPaymentExpired(getPaymentExpiresAt(paymentInfo(order)), nowMs)
    ? "expired"
    : status;
}

function formatDate(value: string | undefined) {
  if (!value) return "Data indisponivel";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function buildTimeline(status: OrderStatus): ProfileOrderTimelineEvent[] {
  if (status === "expired") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "O prazo de pagamento terminou antes da confirmacao.",
        id: "expired",
        state: "current",
        title: "Pagamento expirado",
      },
    ];
  }

  if (status === "cancelled") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "O atendimento foi cancelado antes do envio.",
        id: "cancelled",
        state: "current",
        title: "Atendimento cancelado",
      },
    ];
  }

  if (status === "awaiting_payment") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "Conclua o pagamento para liberar o pedido para envio.",
        id: "awaiting_payment",
        state: "current",
        title: "Aguardando pagamento",
      },
    ];
  }

  const stages: Array<{ id: string; title: string; description: string }> = [
    { id: "awaiting", title: "Aguardando envio", description: "Pedido recebido pelo vendor." },
    { id: "picking", title: "Em separacao", description: "Itens sendo preparados para envio." },
    { id: "shipped", title: "Enviado", description: "Pedido liberado para entrega." },
    { id: "delivered", title: "Entregue", description: "Atendimento finalizado." },
  ];
  const currentIndex = {
    awaiting_shipment: 0,
    picking: 1,
    shipped: 2,
    delivered: 3,
  }[status];

  return stages.map((stage, index) => ({
    ...stage,
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "pending",
  }));
}

function formatAddress(order: WpProfileOrder) {
  const address = order.shipping_address;
  if (!address) return "Endereco nao informado.";

  const street = [address.address_1, address.address_2].filter(Boolean).join(", ");
  const city = [address.city, address.state].filter(Boolean).join(" - ");
  const parts = [street, city, address.postcode ? `CEP: ${address.postcode}` : ""].filter(Boolean);
  return parts.join(", ") || "Endereco nao informado.";
}

function mapSummary(order: WpProfileOrder): Order {
  return {
    id: String(order.id ?? ""),
    orderNumber: `#${order.order_number ?? ""}`,
    status: resolveStatus(order),
    date: formatDate(order.created_at),
    itemsCount: Number(order.items_count) || 0,
    total: Number(order.total) || 0,
  };
}

function mapDetail(order: WpProfileOrder): ProfileOrderDetail {
  const status = resolveStatus(order);
  const trackingCode = typeof order.tracking_code === "string" && order.tracking_code ? order.tracking_code : null;

  return {
    id: String(order.id ?? ""),
    orderNumber: `#${order.order_number ?? ""}`,
    status,
    dateLabel: formatDate(order.created_at),
    storeLabel: order.vendor_name || "Vendor Papelito",
    tracking: trackingCode
      ? {
          carrier: order.shipping_service || "Entrega",
          code: trackingCode,
          estimatedDeliveryLabel:
            Number(order.delivery_time_days) > 0
              ? `${Number(order.delivery_time_days)} dias uteis`
              : "Prazo nao informado",
        }
      : null,
    timeline: buildTimeline(status),
    deliveryAddress: formatAddress(order),
    items: (order.items ?? []).map((item) => {
      const quantity = Number(item.qty) || 0;
      return {
        id: String(item.item_id ?? ""),
        name: item.name ?? "Produto",
        quantity,
        unitPrice: quantity > 0 ? (Number(item.total) || 0) / quantity : 0,
      };
    }),
    subtotal: Number(order.subtotal) || 0,
    shipping: Number(order.shipping_total) || 0,
    total: Number(order.total) || 0,
    payment: paymentInfo(order),
  };
}

async function getProfileAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}

async function fetchProfileOrder(orderId: string, accessToken: string): Promise<WpProfileOrder | null> {
  const result = await wpRest<WpProfileOrder>(`/papelito/v1/profile/me/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? result.data : null;
}

export async function getProfileOrders({
  page = 1,
  perPage = 10,
}: {
  page?: number;
  perPage?: number;
} = {}): Promise<ProfileOrdersSnapshot> {
  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return {
      items: [],
      page,
      perPage,
      total: 0,
      totalPages: 1,
    };
  }

  const result = await wpRest<WpProfileOrdersList>(
    `/papelito/v1/profile/me/orders?page=${page}&per_page=${perPage}`,
    {
    headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!result.ok) {
    return {
      items: [],
      page,
      perPage,
      total: 0,
      totalPages: 1,
    };
  }

  const items = result.data.items ?? [];
  const awaitingPaymentOrderIds = items
    .filter((order) => mapStatus(order.vendor_status) === "awaiting_payment")
    .map((order) => String(order.id ?? ""))
    .filter(Boolean);

  const detailEntries = await Promise.all(
    awaitingPaymentOrderIds.map(async (orderId) => [
      orderId,
      await fetchProfileOrder(orderId, accessToken),
    ] as const),
  );
  const detailsById = new Map(detailEntries);

  return {
    items: items.map((order) => mapSummary(detailsById.get(String(order.id ?? "")) ?? order)),
    page: Number(result.data.page) || page,
    perPage: Number(result.data.per_page) || perPage,
    total: Number(result.data.total) || 0,
    totalPages: Math.max(1, Number(result.data.total_pages) || 1),
  };
}

export async function getProfileOrderDetail(orderId: string): Promise<ProfileOrderDetail | null> {
  const accessToken = await getProfileAccessToken();
  if (!accessToken || !/^\d+$/.test(orderId)) return null;

  const result = await fetchProfileOrder(orderId, accessToken);

  return result ? mapDetail(result) : null;
}
