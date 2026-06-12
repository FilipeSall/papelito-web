import "server-only";

import { getServerSession } from "next-auth";

import type { Order } from "@/components/layout/profile-page/order-card";
import type { OrderStatus } from "@/components/layout/profile-page/order-status-badge";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import type { ProfileOrderDetail, ProfileOrderTimelineEvent } from "../types/profile-order-detail";

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

function formatDate(value: string | undefined) {
  if (!value) return "Data indisponivel";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function buildTimeline(status: OrderStatus): ProfileOrderTimelineEvent[] {
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
    status: mapStatus(order.vendor_status),
    date: formatDate(order.created_at),
    itemsCount: Number(order.items_count) || 0,
    total: Number(order.total) || 0,
  };
}

function mapDetail(order: WpProfileOrder): ProfileOrderDetail {
  const status = mapStatus(order.vendor_status);
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
    payment: {
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
    },
  };
}

async function getProfileAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}

export async function getProfileOrders(): Promise<Order[]> {
  const accessToken = await getProfileAccessToken();
  if (!accessToken) return [];

  const result = await wpRest<WpProfileOrdersList>("/papelito/v1/profile/me/orders?per_page=20", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? (result.data.items ?? []).map(mapSummary) : [];
}

export async function getProfileOrderDetail(orderId: string): Promise<ProfileOrderDetail | null> {
  const accessToken = await getProfileAccessToken();
  if (!accessToken || !/^\d+$/.test(orderId)) return null;

  const result = await wpRest<WpProfileOrder>(`/papelito/v1/profile/me/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? mapDetail(result.data) : null;
}
