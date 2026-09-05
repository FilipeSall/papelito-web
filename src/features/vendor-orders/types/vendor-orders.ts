/**
 * Tamanho de página da listagem do vendor.
 *
 * Vive aqui, e não no serviço de servidor, porque o mapper é compartilhado com
 * o cliente: importá-la de um módulo `server-only` arrastava a sessão do
 * NextAuth — e com ela `next/headers` — para o bundle do browser.
 */
export const VENDOR_ORDERS_PER_PAGE = 10;

export type VendorOrderStatus =
  | "aguardando_pagamento"
  | "aguardando_estoque"
  | "aguardando_envio"
  | "em_separacao"
  | "enviado"
  | "entregue"
  | "cancelado";

export type VendorOrderItem = {
  itemId: number;
  name: string;
  productId: number;
  qty: number;
  total: number;
};

export type ShipmentLogisticsStatus =
  | "tracking_pending"
  | "preposted"
  | "posted"
  | "in_transit"
  | "out_for_delivery"
  | "pickup_available"
  | "delivery_failed"
  | "returning"
  | "returned"
  | "lost"
  | "cancelled"
  | "expired"
  | "delivered";

export type ShipmentGenerationStatus =
  | "not_started"
  | "generating"
  | "generated"
  | "failed"
  | "uncertain";

export type VendorOrderShipment = {
  creationOutcome: string;
  deliveredAt: string;
  hasError: boolean;
  id: number;
  generationStatus: ShipmentGenerationStatus;
  labelAvailable: boolean;
  lastEventAt: string;
  lastEventCode: string;
  lastEventDescription: string;
  lastEventLocation: string;
  lastEventType: string;
  nextReconciliationAt: string;
  postedAt: string;
  serviceCode: string;
  provider: "correios" | "manual" | "mock" | string;
  reconciliationAttempts: number;
  reconciliationStatus: string;
  isTest: boolean;
  status: ShipmentLogisticsStatus;
  supportReviewRequired: boolean;
  trackingCode: string;
};

export type VendorOrderLogistics = {
  automaticGenerationEnabled: boolean;
  allPackagesDone: boolean;
  creationOutcome: string;
  generationStatus: ShipmentGenerationStatus;
  lastEventAt: string;
  packagesDelivered: number;
  packagesTotal: number;
  manualRegistrationEnabled: boolean;
  manualFallbackAvailable: boolean;
  generationErrorCode: string;
  nextReconciliationAt: string;
  reconciliationAttempts: number;
  reconciliationStatus: string;
  shipments: VendorOrderShipment[];
  status: ShipmentLogisticsStatus | "not_started";
  supportReviewRequired: boolean;
};

export type VendorOrderSummary = {
  createdAt: string;
  customerName: string;
  fiscalPending: boolean;
  hasFiscalDocument: boolean;
  id: number;
  itemsCount: number;
  itemsLabel: string;
  nextStatuses: VendorOrderStatus[];
  orderNumber: string;
  status: VendorOrderStatus;
  total: number;
};

export type VendorOrdersFiscalFilter = "all" | "pending";

export type VendorOrdersFilters = {
  fiscal: VendorOrdersFiscalFilter;
  page: number;
  search: string;
  status: VendorOrderStatus | "all";
};

/**
 * Contagens de toda a carteira do vendor, não só da página.
 *
 * O backend as calcula sobre o recorte de busca e **antes** do filtro de
 * situação, para cada ficha continuar mostrando quantos pedidos existem na fila
 * dela mesmo com outro filtro ativo.
 */
export type VendorOrdersSummary = Record<VendorOrderStatus | "all" | "fiscal_pending", number>;

export type VendorFiscalEventName = "anexada" | "removida" | "substituida";

/**
 * Registro da trilha da nota.
 *
 * A trilha é o único rastro que sobra quando a nota é removida ou trocada — o
 * arquivo anterior deixa de existir, e `originalName` é o que permite dizer
 * *qual* nota era aquela.
 */
export type VendorFiscalEvent = {
  actorRole: "" | "admin" | "sistema" | "vendor";
  createdAt: string;
  event: VendorFiscalEventName | string;
  id: number;
  originalName: string;
};

/**
 * Nota fiscal anexada ao pedido: só o arquivo.
 *
 * A Papelito não emite nota nem lê o conteúdo do documento. Não há chave de
 * acesso, número, série, emissão nem valor — o sistema guarda o arquivo e não
 * afirma nada sobre ele.
 */
export type VendorFiscalDocument = {
  createdAt: string;
  id: number;
  mime: string;
  originalName: string;
  sizeBytes: number;
  updatedAt: string;
};

/**
 * Bloco de nota fiscal do pedido. `blockReason` é vazio quando o pedido aceita
 * anexo — a tela nunca recalcula essa regra por conta própria.
 *
 * `events` fica no bloco, e não no documento, porque a trilha sobrevive à
 * remoção da nota.
 */
export type VendorOrderFiscal = {
  blockReason: "" | "aguardando_pagamento" | "cancelado";
  canAttach: boolean;
  document: VendorFiscalDocument | null;
  enabled: boolean;
  events: VendorFiscalEvent[];
  limits: { pdf: number; xml: number };
};

export type VendorOrderBilling = {
  cnpj: string;
  contactName: string;
  email: string;
  fiscalAddress: {
    city: string;
    complement: string;
    neighborhood: string;
    number: string;
    postcode: string;
    state: string;
    street: string;
  };
  legalName: string;
  phone: string;
};

/** Recibo do pagamento. `available` é false até o pagamento ser confirmado. */
export type VendorOrderReceipt = {
  available: boolean;
  issuedAt: string;
  number: string;
};

export type VendorOrderPayment = {
  method: string;
  state: string;
};

export type VendorOrderDetail = VendorOrderSummary & {
  billing: VendorOrderBilling;
  /** Justificativa registrada na transição para `cancelado`. Vazia nos demais estados. */
  cancelReason: string;
  deliveryTimeDays: number;
  fiscal: VendorOrderFiscal;
  items: VendorOrderItem[];
  paidAt: string;
  payment: VendorOrderPayment;
  receipt: VendorOrderReceipt;
  phone: string;
  shippingAddress: {
    address1: string;
    address2: string;
    city: string;
    postcode: string;
    state: string;
  };
  shippingService: string;
  shippingTotal: number;
  subtotal: number;
  trackingCode: string | null;
  logistics: VendorOrderLogistics;
};

export type VendorOrdersSnapshot = {
  items: VendorOrderSummary[];
  page: number;
  perPage: number;
  summary: VendorOrdersSummary;
  total: number;
  totalPages: number;
  /** Leitura falhou. Lista vazia por erro não é lista vazia por não ter pedido. */
  unavailable?: boolean;
};
