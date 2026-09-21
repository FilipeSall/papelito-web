import "server-only";

import { getServerSession } from "next-auth";

import type { Order } from "@/components/layout/profile-page/order-card";
import type { OrderStatus } from "@/components/layout/profile-page/order-status-badge";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import type {
  ProfileOrderDetail,
  ProfileOrderDocumentsSurface,
  ProfileOrderFiscalDocument,
  ProfileOrderReceipt,
  ProfileOrderRefund,
  ProfileOrderReturnEligibility,
  ProfileOrderTimelineEvent,
} from "../types/profile-order-detail";
import type { ProfileOrdersSnapshot } from "../types/profile-orders";
import { getPaymentExpiresAt, isPaymentExpired } from "../utils/payment-deadline";
import { formatBusinessDays } from "@/features/shipping/utils/format-business-days";
import { resolveShippingProvider } from "@/features/shipping/utils/resolve-shipping-provider";
import { shippingProviderLabel } from "@/features/shipping/utils/shipping-provider-label";

type WpProfileShipment = {
  id?: number;
  provider?: string;
  external_reference?: string;
  tracking_code?: string | null;
  status?: string;
  last_event_at?: string;
  last_event_description?: string;
  last_event_location?: string;
  delivered_at?: string;
};

type WpProfileOrder = {
  created_at?: string;
  returns?: {
    can_request?: boolean;
    reason?: string;
    message?: string;
    window_days?: number;
    window_ends_at?: string;
    items?: Array<{ order_item_id?: number; name?: string; purchased_qty?: number; returnable_qty?: number }>;
  };
  return_requests?: Array<{ id?: number; status?: string }>;
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
  shipping_provider?: string;
  shipping_service?: string;
  shipping_total?: number;
  subtotal?: number;
  total?: number;
  tracking_code?: string | null;
  logistics?: {
    status?: string;
    all_packages_done?: boolean;
    packages_total?: number;
    packages_delivered?: number;
    last_event_at?: string;
    shipments?: WpProfileShipment[];
  };
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
  receipt?: {
    number?: string | null;
    available?: boolean;
    issued_at?: string | null;
  };
  refund?: {
    amountCents?: number;
    mode?: string;
    overdue?: boolean;
    proofId?: number;
    receiptNumber?: string;
    refundDueAt?: string;
    settledAt?: string;
    status?: string;
  } | null;
  fiscal_document?: {
    created_at?: string;
    mime?: string;
    original_name?: string;
    size_bytes?: number;
  } | null;
  documents?: { surface?: string };
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
    case "aguardando_estoque":
      return "stock_review";
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
    case "cancelamento_solicitado":
      return "cancellation_requested";
    case "estornado":
      return "refunded";
    case "aguardando_pagamento":
    default:
      return "awaiting_payment";
  }
}

/**
 * Elegibilidade de devolução vinda do WordPress. Ausente ou malformada vira
 * "não pode" — a interface nunca infere a janela por conta própria.
 */
function returnsInfo(order: WpProfileOrder): ProfileOrderReturnEligibility {
  const source = order.returns;
  const items = Array.isArray(source?.items) ? source.items : [];

  return {
    canRequest: source?.can_request === true,
    reason: typeof source?.reason === "string" ? source.reason : "",
    message: typeof source?.message === "string" ? source.message : "",
    windowDays: Number(source?.window_days) || 0,
    windowEndsAt: typeof source?.window_ends_at === "string" ? source.window_ends_at : "",
    items: items
      .map((item) => ({
        orderItemId: Number(item?.order_item_id) || 0,
        name: typeof item?.name === "string" && item.name ? item.name : "Produto",
        purchasedQty: Number(item?.purchased_qty) || 0,
        returnableQty: Math.max(0, Number(item?.returnable_qty) || 0),
      }))
      .filter((item) => item.orderItemId > 0),
  };
}

function returnRequestsInfo(order: WpProfileOrder) {
  return (order.return_requests ?? [])
    .map((request) => ({ id: Number(request.id) || 0, status: typeof request.status === "string" ? request.status : "" }))
    .filter((request) => request.id > 0 && request.status);
}

function receiptInfo(order: WpProfileOrder): ProfileOrderReceipt {
  const number = typeof order.receipt?.number === "string" ? order.receipt.number.trim() : "";
  const issuedAt = typeof order.receipt?.issued_at === "string" ? order.receipt.issued_at.trim() : "";

  return {
    available: order.receipt?.available === true,
    issuedAtLabel: issuedAt || null,
    number: number || null,
  };
}

/**
 * Nota fiscal do comprador, ou `null`.
 *
 * Sem arquivo não existe nota para o comprador abrir — e um bloco vazio
 * anunciaria a ausência, que é justamente o que a tela não deve fazer.
 */
function fiscalDocumentInfo(order: WpProfileOrder): ProfileOrderFiscalDocument | null {
  const document = order.fiscal_document;

  if (!document) return null;

  return {
    attachedAtLabel: document.created_at ?? "",
    originalName: document.original_name ?? "",
    sizeBytes: Number(document.size_bytes) || 0,
  };
}

function paymentInfo(order: WpProfileOrder) {
  return {
    methodLabel: order.payment_method || "Pagamento não informado",
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
  if (!value) return "Data indisponível";
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(date);
}

function buildTimeline(status: OrderStatus, order: WpProfileOrder): ProfileOrderTimelineEvent[] {
  if (status === "expired") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "O prazo de pagamento terminou antes da confirmação.",
        id: "expired",
        state: "current",
        title: "Pagamento expirado",
      },
    ];
  }

  if (status === "cancellation_requested") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "Pagamento confirmado.",
        id: "payment",
        state: "done",
        title: "Pagamento confirmado",
      },
      {
        description: "A loja cancelou o pedido e o valor está sendo devolvido.",
        id: "refund",
        state: "current",
        title: "Estorno em andamento",
      },
    ];
  }

  if (status === "refunded") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "Pagamento confirmado.",
        id: "payment",
        state: "done",
        title: "Pagamento confirmado",
      },
      {
        description: "O pedido foi cancelado e o valor foi devolvido.",
        id: "refunded",
        state: "current",
        title: "Pedido estornado",
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

  if (status === "stock_review") {
    return [
      {
        description: "O pedido foi registrado na plataforma.",
        id: "received",
        state: "done",
        title: "Pedido realizado",
      },
      {
        description: "Pagamento confirmado.",
        id: "payment",
        state: "done",
        title: "Pagamento confirmado",
      },
      {
        description: "O estoque está sendo confirmado para definir o próximo passo do atendimento.",
        id: "stock_review",
        state: "current",
        title: "Análise de estoque",
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
    { id: "payment", title: "Pagamento", description: "Pagamento confirmado." },
    { id: "awaiting", title: "Aguardando envio", description: "Pedido recebido pelo vendor." },
    { id: "picking", title: "Em separação", description: "Itens sendo preparados para envio." },
    { id: "shipped", title: "Enviado", description: "Postagem confirmada pela transportadora." },
    { id: "delivered", title: "Entregue", description: "Entrega confirmada pela transportadora." },
  ];
  const currentIndex = {
    awaiting_shipment: 1,
    picking: 2,
    shipped: 3,
    delivered: 4,
  }[status];

  const logisticsMessages: Record<string, { title: string; description: string }> = {
    preposted: { title: "Etiqueta gerada", description: "Aguardando a postagem da encomenda." },
    posted: { title: "Postado", description: "A encomenda foi postada e recebida pela transportadora." },
    in_transit: { title: "Em transito", description: "A encomenda está em deslocamento até o endereço de entrega." },
    out_for_delivery: { title: "Saiu para entrega", description: "A encomenda está em rota de entrega." },
    pickup_available: { title: "Disponível para retirada", description: "Retire a encomenda na unidade indicada." },
    delivery_failed: { title: "Tentativa sem sucesso", description: "A entrega não foi concluida; acompanhe a próxima orientacao." },
    returning: { title: "Em devolução", description: "A encomenda está retornando ao remetente." },
    returned: { title: "Devolvido", description: "A encomenda foi devolvida ao remetente." },
    lost: { title: "Ocorrência no envio", description: "O envio exige acompanhamento do vendor e da Papelito." },
  };
  const logistics = logisticsMessages[order.logistics?.status ?? ""];
  const leadShipment = pickLeadShipment(order.logistics?.shipments);
  const deliveredAt = leadShipment?.delivered_at || undefined;
  const lastEventLocation = leadShipment?.last_event_location || undefined;

  return stages.map((stage, index) => {
    const isCurrent = index === currentIndex;
    const isLogisticsStage = isCurrent && index >= 3 && logistics;
    const isDelivered = isCurrent && index === 4;
    const timestampSource = isDelivered ? deliveredAt ?? order.logistics?.last_event_at : order.logistics?.last_event_at;
    return {
      ...stage,
      ...(isLogisticsStage ? logistics : {}),
      timestampLabel: isCurrent && index >= 3 ? formatDateTime(timestampSource) : undefined,
      locationLabel: isLogisticsStage ? lastEventLocation : undefined,
      state: index < currentIndex ? "done" : index === currentIndex ? "current" : "pending",
    };
  });
}

function pickLeadShipment(shipments: WpProfileShipment[] | undefined): WpProfileShipment | undefined {
  const list = shipments ?? [];
  const rank: Record<string, number> = {
    preposted: 10,
    posted: 30,
    in_transit: 40,
    out_for_delivery: 50,
    pickup_available: 55,
    delivery_failed: 55,
    returning: 60,
    returned: 65,
    lost: 65,
    delivered: 100,
  };
  return list.reduce<WpProfileShipment | undefined>((lead, shipment) => {
    if (!lead) return shipment;
    return (rank[shipment.status ?? ""] ?? 0) > (rank[lead.status ?? ""] ?? 0) ? shipment : lead;
  }, undefined);
}

function formatAddress(order: WpProfileOrder) {
  const address = order.shipping_address;
  if (!address) return "Endereço não informado.";

  const street = [address.address_1, address.address_2].filter(Boolean).join(", ");
  const city = [address.city, address.state].filter(Boolean).join(" - ");
  const parts = [street, city, address.postcode ? `CEP: ${address.postcode}` : ""].filter(Boolean);
  return parts.join(", ") || "Endereço não informado.";
}

function mapSummary(order: WpProfileOrder): Order {
  return {
    id: String(order.id ?? ""),
    orderNumber: `#${order.order_number ?? ""}`,
    status: resolveStatus(order),
    date: formatDate(order.created_at),
    itemsCount: Number(order.items_count) || 0,
    trackingCode: typeof order.tracking_code === "string" && order.tracking_code ? order.tracking_code : null,
    returnRequests: returnRequestsInfo(order),
    total: Number(order.total) || 0,
  };
}

/**
 * Identifica a transportadora da remessa, sem nunca chutar pelo que existe nela.
 *
 * A remessa manda; o pedido é o segundo lugar a consultar, porque remessa
 * gravada antes do contrato multicarrier não traz `provider`. A tradução em si
 * é a mesma do painel do vendor, e por isso delega: divergir entre as duas
 * contas faria o mesmo pedido mudar de transportadora conforme quem abre.
 */
function shipmentProvider(shipment: WpProfileShipment | undefined, order: WpProfileOrder) {
  return resolveShippingProvider(shipment?.provider || order.shipping_provider);
}

/**
 * Referência que o comprador usa para acompanhar a entrega.
 *
 * Correios rastreia por S10; Braspress não emite S10 nenhum e é acompanhada pelo
 * número do pedido acordado com a transportadora. Exigir `tracking_code` deixava
 * todo pedido Braspress sem bloco de rastreio na conta do comprador.
 */
function trackingReference(shipment: WpProfileShipment | undefined, order: WpProfileOrder) {
  const candidates = [shipment?.tracking_code, shipment?.external_reference, order.tracking_code];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function mapDetail(order: WpProfileOrder): ProfileOrderDetail {
  const status = resolveStatus(order);
  const leadShipment = pickLeadShipment(order.logistics?.shipments);
  const trackingCode = trackingReference(leadShipment, order);

  return {
    id: String(order.id ?? ""),
    orderNumber: `#${order.order_number ?? ""}`,
    status,
    dateLabel: formatDate(order.created_at),
    storeLabel: order.vendor_name || "Vendor Papelito",
    tracking: trackingCode
      ? {
          carrier: order.shipping_service || "Entrega",
          carrierLabel: shippingProviderLabel(shipmentProvider(leadShipment, order)),
          provider: shipmentProvider(leadShipment, order),
          code: trackingCode,
          estimatedDeliveryLabel:
            Number(order.delivery_time_days) > 0
              ? formatBusinessDays(Number(order.delivery_time_days))
              : "Prazo não informado",
        }
      : null,
    timeline: buildTimeline(status, order),
    shipments: (order.logistics?.shipments ?? []).map((shipment) => ({
      carrierLabel: shippingProviderLabel(shipmentProvider(shipment, order)),
      provider: shipmentProvider(shipment, order),
      code: trackingReference(shipment, order) ?? "",
      deliveredAt: shipment.delivered_at ?? "",
      id: Number(shipment.id) || 0,
      lastEventAt: shipment.last_event_at ?? "",
      lastEventDescription: shipment.last_event_description ?? "",
      lastEventLocation: shipment.last_event_location ?? "",
      status: shipment.status ?? "tracking_pending",
    })),
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
    documentsSurface: documentsSurface(order),
    fiscalDocument: fiscalDocumentInfo(order),
    receipt: receiptInfo(order),
    returns: returnsInfo(order),
    returnRequests: returnRequestsInfo(order),
    refund: refundInfo(order),
  };
}

/**
 * Superfície de documentos. Sem o campo no payload a tela segue no fluxo
 * normal: quem fecha a área de documentos do pedido é o WordPress, e a omissão
 * — deploy do Next à frente do backend — não pode virar decisão do front.
 */
function documentsSurface(order: WpProfileOrder): ProfileOrderDocumentsSurface {
  return order.documents?.surface === "estorno" ? "estorno" : "pedido";
}

const REFUND_STATUSES = new Set<ProfileOrderRefund["status"]>(["processando", "reembolsado", "falhou", "manual_pendente"]);

/**
 * Estorno vindo do WordPress. Estado desconhecido vira ausência: a tela não
 * anuncia devolução que o backend não confirmou existir.
 */
function refundInfo(order: WpProfileOrder): ProfileOrderRefund | null {
  const source = order.refund;
  const status = source?.status ?? "";

  if (!source || !REFUND_STATUSES.has(status as ProfileOrderRefund["status"])) return null;

  return {
    amountCents: Number(source.amountCents) || 0,
    mode: source.mode === "api" ? "api" : "manual",
    overdue: source.overdue === true,
    proofId: Number(source.proofId) || 0,
    receiptNumber: typeof source.receiptNumber === "string" ? source.receiptNumber : "",
    refundDueAt: typeof source.refundDueAt === "string" ? source.refundDueAt : "",
    settledAt: typeof source.settledAt === "string" ? source.settledAt : "",
    status: status as ProfileOrderRefund["status"],
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
