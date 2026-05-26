export type VendorOrderStatus =
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

export type VendorOrderDetail = VendorOrderSummary & {
  deliveryTimeDays: number;
  items: VendorOrderItem[];
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
};

export type VendorOrdersSnapshot = {
  items: VendorOrderSummary[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};
