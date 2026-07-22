export type VendorOrderStatus =
  | "aguardando_pagamento"
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
  id: number;
  itemsCount: number;
  itemsLabel: string;
  orderNumber: string;
  status: VendorOrderStatus;
  total: number;
};

export type VendorOrdersFilters = {
  page: number;
  search: string;
  status: VendorOrderStatus | "all";
};

export type VendorOrderDetail = VendorOrderSummary & {
  deliveryTimeDays: number;
  items: VendorOrderItem[];
  paidAt: string;
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
  total: number;
  totalPages: number;
};
