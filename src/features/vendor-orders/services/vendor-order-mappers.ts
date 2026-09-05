import { VENDOR_ORDERS_PER_PAGE } from "../types/vendor-orders";
import type {
  VendorFiscalDocStatus,
  VendorFiscalDocument,
  VendorFiscalKeyStatus,
  VendorFiscalRole,
  VendorOrderBilling,
  VendorOrderDetail,
  VendorOrderFiscal,
  VendorOrderStatus,
  ShipmentLogisticsStatus,
  ShipmentGenerationStatus,
  VendorOrdersSnapshot,
  VendorOrdersSummary,
  VendorOrderSummary,
} from "../types/vendor-orders";


export type WpVendorOrder = {
  created_at?: string;
  customer_name?: string;
  delivery_time_days?: number;
  id?: number;
  items?: Array<{ item_id?: number; name?: string; product_id?: number; qty?: number; total?: number }>;
  items_count?: number;
  items_label?: string;
  order_number?: string;
  paid_at?: string;
  phone?: string;
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
  vendor_status?: string;
  next_statuses?: string[];
  cancel_reason?: string;
  has_fiscal_document?: boolean;
  fiscal_pending?: boolean;
  payment?: { method?: string; state?: string };
  receipt?: { available?: boolean; issued_at?: string | null; number?: string | null };
  billing?: WpVendorBilling;
  fiscal?: WpVendorFiscal;
  logistics?: {
    automatic_generation_enabled?: boolean;
    all_packages_done?: boolean;
    generation_status?: string;
    creation_outcome?: string;
    last_event_at?: string;
    packages_delivered?: number;
    packages_total?: number;
    manual_registration_enabled?: boolean;
    manual_fallback_available?: boolean;
    generation_error_code?: string;
    next_reconciliation_at?: string;
    reconciliation_attempts?: number;
    reconciliation_status?: string;
    status?: string;
    support_review_required?: boolean;
    shipments?: Array<{
      creation_outcome?: string;
      delivered_at?: string;
      has_error?: boolean;
      id?: number;
      generation_status?: string;
      label_available?: boolean;
      last_event_at?: string;
      last_event_code?: string;
      last_event_description?: string;
      last_event_location?: string;
      last_event_type?: string;
      next_reconciliation_at?: string;
      posted_at?: string;
      reconciliation_attempts?: number;
      reconciliation_status?: string;
      service_code?: string;
      provider?: string;
      is_test?: boolean;
      status?: string;
      support_review_required?: boolean;
      tracking_code?: string;
    }>;
  };
};

export type WpVendorBilling = {
  cnpj?: string;
  contact_name?: string;
  email?: string;
  fiscal_address?: {
    city?: string;
    complement?: string;
    neighborhood?: string;
    number?: string;
    postcode?: string;
    state?: string;
    street?: string;
  };
  legal_name?: string;
  phone?: string;
};

export type WpVendorFiscalFile = {
  created_at?: string;
  id?: number;
  mime?: string;
  original_name?: string;
  role?: string;
  size_bytes?: number;
};

export type WpVendorFiscalEvent = {
  actor_role?: string;
  created_at?: string;
  doc_status?: string;
  event?: string;
  id?: number;
  role?: string;
};

export type WpVendorFiscalDocument = {
  access_key?: string;
  access_key_status?: string;
  created_at?: string;
  doc_number?: string;
  doc_series?: string;
  doc_status?: string;
  doc_type?: string;
  events?: WpVendorFiscalEvent[];
  files?: WpVendorFiscalFile[];
  flags?: string[];
  id?: number;
  issued_at?: string;
  issuer_cnpj?: string;
  issuer_name?: string;
  internal_notes?: string;
  notes?: string;
  protocol?: string;
  total_cents?: number;
  updated_at?: string;
  validation_level?: number;
};

export type WpVendorFiscal = {
  block_reason?: string;
  can_attach?: boolean;
  document?: WpVendorFiscalDocument | null;
  enabled?: boolean;
  limits?: { danfe_pdf?: number; xml?: number };
};

export type WpVendorOrdersList = {
  items?: WpVendorOrder[];
  page?: number;
  per_page?: number;
  summary?: Record<string, number>;
  total?: number;
  total_pages?: number;
};

const statuses = new Set<VendorOrderStatus>([
  "aguardando_pagamento",
  "aguardando_estoque",
  "aguardando_envio",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
]);

export function isVendorOrderStatus(value: unknown): value is VendorOrderStatus {
  return typeof value === "string" && statuses.has(value as VendorOrderStatus);
}

export function mapVendorOrderStatus(value: unknown): VendorOrderStatus {
  return isVendorOrderStatus(value) ? value : "aguardando_pagamento";
}

export function mapVendorOrderSummary(order: WpVendorOrder): VendorOrderSummary {
  return {
    createdAt: order.created_at ?? "",
    customerName: order.customer_name?.trim() || "Cliente não identificado",
    fiscalPending: Boolean(order.fiscal_pending),
    hasFiscalDocument: Boolean(order.has_fiscal_document),
    id: Number(order.id) || 0,
    itemsCount: Number(order.items_count) || 0,
    itemsLabel: order.items_label?.trim() || "Sem itens",
    nextStatuses: (order.next_statuses ?? []).filter(isVendorOrderStatus),
    orderNumber: order.order_number ?? "",
    status: mapVendorOrderStatus(order.vendor_status),
    total: Number(order.total) || 0,
  };
}

const fiscalRoles = new Set<VendorFiscalRole>(["danfe_pdf", "other", "xml"]);
const fiscalDocStatuses = new Set<VendorFiscalDocStatus>([
  "aceita",
  "cancelada",
  "pendente_revisao",
  "recebida",
  "rejeitada",
  "substituida",
]);
const fiscalKeyStatuses = new Set<VendorFiscalKeyStatus>(["ausente", "invalida", "valida"]);

function mapFiscalDocument(document: WpVendorFiscalDocument | null | undefined): VendorFiscalDocument | null {
  if (!document || !document.id) return null;

  const keyStatus = document.access_key_status ?? "";
  const docStatus = document.doc_status ?? "";

  return {
    accessKey: document.access_key ?? "",
    accessKeyStatus: fiscalKeyStatuses.has(keyStatus as VendorFiscalKeyStatus)
      ? (keyStatus as VendorFiscalKeyStatus)
      : "ausente",
    createdAt: document.created_at ?? "",
    docNumber: document.doc_number ?? "",
    docSeries: document.doc_series ?? "",
    docStatus: fiscalDocStatuses.has(docStatus as VendorFiscalDocStatus)
      ? (docStatus as VendorFiscalDocStatus)
      : "recebida",
    docType: document.doc_type ?? "nfe",
    events: (document.events ?? [])
      .filter((entry) => Number(entry.id) > 0 && (entry.event ?? "") !== "")
      .map((entry) => ({
        actorRole: entry.actor_role ?? "",
        createdAt: entry.created_at ?? "",
        docStatus: entry.doc_status ?? "",
        event: entry.event ?? "",
        id: Number(entry.id),
        role: fiscalRoles.has(entry.role as VendorFiscalRole) ? (entry.role as VendorFiscalRole) : "",
      })),
    files: (document.files ?? []).map((file) => ({
      createdAt: file.created_at ?? "",
      id: Number(file.id) || 0,
      mime: file.mime ?? "",
      originalName: file.original_name ?? "",
      role: fiscalRoles.has(file.role as VendorFiscalRole) ? (file.role as VendorFiscalRole) : "other",
      sizeBytes: Number(file.size_bytes) || 0,
    })),
    flags: document.flags ?? [],
    id: Number(document.id),
    issuedAt: document.issued_at ?? "",
    issuerCnpj: document.issuer_cnpj ?? "",
    issuerName: document.issuer_name ?? "",
    notes: document.notes ?? document.internal_notes ?? "",
    protocol: document.protocol ?? "",
    totalCents: Number(document.total_cents) || 0,
    updatedAt: document.updated_at ?? "",
    validationLevel: Number(document.validation_level) || 1,
  };
}

const fiscalBlockReasons = new Set(["aguardando_pagamento", "cancelado"]);

/**
 * Bloco de nota fiscal. Sem o bloco no payload a superfície fica desligada, e
 * não habilitada por omissão: só o WordPress decide se o pedido aceita anexo.
 */
export function mapVendorOrderFiscal(fiscal: WpVendorFiscal | undefined): VendorOrderFiscal {
  const reason = fiscal?.block_reason ?? "";

  return {
    blockReason: fiscalBlockReasons.has(reason) ? (reason as "aguardando_pagamento" | "cancelado") : "",
    canAttach: Boolean(fiscal?.can_attach),
    document: mapFiscalDocument(fiscal?.document),
    enabled: Boolean(fiscal?.enabled),
    limits: {
      danfe_pdf: Number(fiscal?.limits?.danfe_pdf) || 10 * 1024 * 1024,
      xml: Number(fiscal?.limits?.xml) || 2 * 1024 * 1024,
    },
  };
}

function mapVendorOrderBilling(billing: WpVendorBilling | undefined): VendorOrderBilling {
  return {
    cnpj: billing?.cnpj ?? "",
    contactName: billing?.contact_name?.trim() ?? "",
    email: billing?.email ?? "",
    fiscalAddress: {
      city: billing?.fiscal_address?.city ?? "",
      complement: billing?.fiscal_address?.complement ?? "",
      neighborhood: billing?.fiscal_address?.neighborhood ?? "",
      number: billing?.fiscal_address?.number ?? "",
      postcode: billing?.fiscal_address?.postcode ?? "",
      state: billing?.fiscal_address?.state ?? "",
      street: billing?.fiscal_address?.street ?? "",
    },
    legalName: billing?.legal_name?.trim() ?? "",
    phone: billing?.phone ?? "",
  };
}

export function mapVendorOrderDetail(order: WpVendorOrder): VendorOrderDetail {
  const logisticsStatuses = new Set<ShipmentLogisticsStatus>([
    "tracking_pending", "preposted", "posted", "in_transit", "out_for_delivery",
    "pickup_available", "delivery_failed", "returning", "returned", "lost", "cancelled", "expired", "delivered",
  ]);
  const mapLogisticsStatus = (value: string | undefined): ShipmentLogisticsStatus =>
    value && logisticsStatuses.has(value as ShipmentLogisticsStatus)
      ? (value as ShipmentLogisticsStatus)
      : "tracking_pending";
  const generationStatuses = new Set<ShipmentGenerationStatus>([
    "not_started", "generating", "generated", "failed", "uncertain",
  ]);
  const mapGenerationStatus = (
    value: string | undefined,
    fallback: ShipmentGenerationStatus = "not_started",
  ): ShipmentGenerationStatus =>
    value && generationStatuses.has(value as ShipmentGenerationStatus)
      ? (value as ShipmentGenerationStatus)
      : fallback;
  const shipments = (order.logistics?.shipments ?? []).map((shipment) => ({
    creationOutcome: shipment.creation_outcome ?? "created",
    deliveredAt: shipment.delivered_at ?? "",
    hasError: Boolean(shipment.has_error),
    id: Number(shipment.id) || 0,
    generationStatus: mapGenerationStatus(
      shipment.generation_status,
      shipment.tracking_code ? "generated" : "generating",
    ),
    labelAvailable: Boolean(shipment.label_available),
    lastEventAt: shipment.last_event_at ?? "",
    lastEventCode: shipment.last_event_code ?? "",
    lastEventDescription: shipment.last_event_description ?? "",
    lastEventLocation: shipment.last_event_location ?? "",
    lastEventType: shipment.last_event_type ?? "",
    nextReconciliationAt: shipment.next_reconciliation_at ?? "",
    postedAt: shipment.posted_at ?? "",
    serviceCode: shipment.service_code ?? "",
    provider: shipment.provider ?? "correios",
    reconciliationAttempts: Number(shipment.reconciliation_attempts) || 0,
    reconciliationStatus: shipment.reconciliation_status ?? "none",
    isTest: Boolean(shipment.is_test),
    status: mapLogisticsStatus(shipment.status),
    supportReviewRequired: Boolean(shipment.support_review_required),
    trackingCode: shipment.tracking_code ?? "",
  }));
  return {
    ...mapVendorOrderSummary(order),
    billing: mapVendorOrderBilling(order.billing),
    cancelReason: order.cancel_reason?.trim() ?? "",
    deliveryTimeDays: Number(order.delivery_time_days) || 0,
    fiscal: mapVendorOrderFiscal(order.fiscal),
    paidAt: order.paid_at ?? "",
    payment: {
      method: order.payment?.method ?? "",
      state: order.payment?.state ?? "",
    },
    receipt: {
      available: Boolean(order.receipt?.available),
      issuedAt: order.receipt?.issued_at ?? "",
      number: order.receipt?.number ?? "",
    },
    items: (order.items ?? []).map((item) => ({
      itemId: Number(item.item_id) || 0,
      name: item.name ?? "Produto",
      productId: Number(item.product_id) || 0,
      qty: Number(item.qty) || 0,
      total: Number(item.total) || 0,
    })),
    phone: order.phone ?? "",
    shippingAddress: {
      address1: order.shipping_address?.address_1 ?? "",
      address2: order.shipping_address?.address_2 ?? "",
      city: order.shipping_address?.city ?? "",
      postcode: order.shipping_address?.postcode ?? "",
      state: order.shipping_address?.state ?? "",
    },
    shippingService: order.shipping_service ?? "",
    shippingTotal: Number(order.shipping_total) || 0,
    subtotal: Number(order.subtotal) || 0,
    trackingCode: typeof order.tracking_code === "string" ? order.tracking_code : null,
    logistics: {
      automaticGenerationEnabled: Boolean(order.logistics?.automatic_generation_enabled),
      allPackagesDone: Boolean(order.logistics?.all_packages_done),
      creationOutcome: order.logistics?.creation_outcome ?? "not_created",
      generationStatus: mapGenerationStatus(
        order.logistics?.generation_status,
        shipments.length > 0 ? "generated" : "not_started",
      ),
      lastEventAt: order.logistics?.last_event_at ?? "",
      packagesDelivered: Number(order.logistics?.packages_delivered) || 0,
      packagesTotal: Number(order.logistics?.packages_total) || 0,
      manualRegistrationEnabled: Boolean(order.logistics?.manual_registration_enabled),
      manualFallbackAvailable: Boolean(order.logistics?.manual_fallback_available),
      generationErrorCode: order.logistics?.generation_error_code ?? "",
      nextReconciliationAt: order.logistics?.next_reconciliation_at ?? "",
      reconciliationAttempts: Number(order.logistics?.reconciliation_attempts) || 0,
      reconciliationStatus: order.logistics?.reconciliation_status ?? "none",
      shipments,
      status: order.logistics?.status === "not_started"
        ? "not_started"
        : mapLogisticsStatus(order.logistics?.status),
      supportReviewRequired: Boolean(order.logistics?.support_review_required),
    },
  };
}

const summaryKeys: Array<keyof VendorOrdersSummary> = [
  "all",
  "aguardando_pagamento",
  "aguardando_estoque",
  "aguardando_envio",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
  "fiscal_pending",
];

export function mapVendorOrdersSummary(summary: Record<string, number> | undefined): VendorOrdersSummary {
  return Object.fromEntries(
    summaryKeys.map((key) => [key, Number(summary?.[key]) || 0]),
  ) as VendorOrdersSummary;
}

export function mapVendorOrdersSnapshot(data: WpVendorOrdersList): VendorOrdersSnapshot {
  return {
    items: (data.items ?? []).map(mapVendorOrderSummary),
    page: Number(data.page) || 1,
    perPage: Number(data.per_page) || VENDOR_ORDERS_PER_PAGE,
    summary: mapVendorOrdersSummary(data.summary),
    total: Number(data.total) || 0,
    totalPages: Number(data.total_pages) || 1,
  };
}
