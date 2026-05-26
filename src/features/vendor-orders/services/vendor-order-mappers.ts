import type {
  VendorOrderDetail,
  VendorOrderStatus,
  VendorOrdersSnapshot,
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
};

export type WpVendorOrdersList = {
  items?: WpVendorOrder[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
};

const statuses = new Set<VendorOrderStatus>([
  "aguardando_envio",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
]);

export function mapVendorOrderStatus(value: unknown): VendorOrderStatus {
  return typeof value === "string" && statuses.has(value as VendorOrderStatus)
    ? (value as VendorOrderStatus)
    : "aguardando_envio";
}

export function mapVendorOrderSummary(order: WpVendorOrder): VendorOrderSummary {
  return {
    createdAt: order.created_at ?? "",
    customerName: order.customer_name?.trim() || "Cliente nao identificado",
    id: Number(order.id) || 0,
    itemsCount: Number(order.items_count) || 0,
    itemsLabel: order.items_label?.trim() || "Sem itens",
    orderNumber: order.order_number ?? "",
    status: mapVendorOrderStatus(order.vendor_status),
    total: Number(order.total) || 0,
  };
}

export function mapVendorOrderDetail(order: WpVendorOrder): VendorOrderDetail {
  return {
    ...mapVendorOrderSummary(order),
    deliveryTimeDays: Number(order.delivery_time_days) || 0,
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
  };
}

export function mapVendorOrdersSnapshot(data: WpVendorOrdersList): VendorOrdersSnapshot {
  return {
    items: (data.items ?? []).map(mapVendorOrderSummary),
    page: Number(data.page) || 1,
    perPage: Number(data.per_page) || 20,
    total: Number(data.total) || 0,
    totalPages: Number(data.total_pages) || 1,
  };
}
