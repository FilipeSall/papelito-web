import "server-only";

import type { VendorOrderStatus } from "@/features/vendor-orders/types/vendor-orders";
import { wpRest } from "@/lib/server/wp-rest";

export type AdminVendorStockFilter = "all" | "with_stock" | "zeroed_only";

export type AdminVendorStockHistoryEntry = {
  createdAt: string;
  delta: number;
  reason: string;
};

export type AdminVendorStockItem = {
  history: AdminVendorStockHistoryEntry[];
  imageUrl: string;
  isZeroed: boolean;
  productId: number;
  productName: string;
  qty: number;
  sku: string;
  updatedAt: string;
};

export type AdminVendorStockSnapshot = {
  items: AdminVendorStockItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type AdminVendorOrderSummary = {
  createdAt: string;
  customerName: string;
  id: number;
  itemsCount: number;
  itemsLabel: string;
  orderNumber: string;
  status: VendorOrderStatus;
  total: number;
};

export type AdminVendorOrdersSnapshot = {
  items: AdminVendorOrderSummary[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

type RawStockHistoryEntry = {
  created_at?: string;
  delta?: number;
  reason?: string;
};

type RawStockItem = {
  history?: RawStockHistoryEntry[];
  image_url?: string;
  is_zeroed?: boolean;
  product_id?: number;
  product_name?: string;
  qty?: number;
  sku?: string;
  updated_at?: string;
};

type RawStockSnapshot = {
  items?: RawStockItem[];
  page?: number;
  per_page?: number;
  total?: number;
};

type RawOrderItem = {
  created_at?: string;
  customer_name?: string;
  id?: number;
  items_count?: number;
  items_label?: string;
  order_number?: string;
  total?: number;
  vendor_status?: string;
};

type RawOrdersSnapshot = {
  items?: RawOrderItem[];
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
};

function normalizeStockReason(reason: unknown) {
  const value = typeof reason === "string" ? reason.trim() : "";
  return value.replace(/^admin_adjustment:/, "").replace(/^vendor_update:/, "").trim();
}

function normalizeOrderStatus(value: unknown): VendorOrderStatus {
  return value === "aguardando_envio" ||
    value === "em_separacao" ||
    value === "enviado" ||
    value === "entregue" ||
    value === "cancelado"
    ? value
    : "aguardando_envio";
}

export async function getAdminVendorStock(
  accessToken: string | undefined,
  vendorId: number,
  filters: {
    filter: AdminVendorStockFilter;
    page: number;
    paginate?: boolean;
    perPage: number;
    search: string;
  },
): Promise<AdminVendorStockSnapshot> {
  const empty = {
    items: [],
    page: filters.page,
    perPage: filters.perPage,
    total: 0,
    totalPages: 1,
  };

  if (!accessToken || !Number.isFinite(vendorId) || vendorId <= 0) {
    return empty;
  }

  const params = new URLSearchParams({
    filter: filters.filter,
    page: String(filters.page),
    paginate: filters.paginate === false ? "false" : "true",
    per_page: String(filters.perPage),
  });
  if (filters.search) {
    params.set("search", filters.search);
  }

  const result = await wpRest<RawStockSnapshot>(
    `/papelito/v1/admin/vendors/${vendorId}/stock?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!result.ok) {
    return empty;
  }

  const items = (result.data.items ?? []).map((item) => ({
    history: (item.history ?? []).map((entry) => ({
      createdAt: entry.created_at ?? "",
      delta: Number(entry.delta ?? 0),
      reason: normalizeStockReason(entry.reason),
    })),
    imageUrl: item.image_url ?? "",
    isZeroed: Boolean(item.is_zeroed),
    productId: Number(item.product_id) || 0,
    productName: item.product_name ?? "Produto",
    qty: Number(item.qty) || 0,
    sku: item.sku ?? "",
    updatedAt: item.updated_at ?? "",
  }));

  const perPage = Number(result.data.per_page) || filters.perPage;
  const total = Number(result.data.total) || 0;

  return {
    items,
    page: Number(result.data.page) || filters.page,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / Math.max(1, perPage))),
  };
}

export async function getAdminVendorOrders(
  accessToken: string | undefined,
  vendorId: number,
  filters: {
    page: number;
    perPage: number;
    search: string;
    status: VendorOrderStatus | "all";
  },
): Promise<AdminVendorOrdersSnapshot> {
  const empty = {
    items: [],
    page: filters.page,
    perPage: filters.perPage,
    total: 0,
    totalPages: 1,
  };

  if (!accessToken || !Number.isFinite(vendorId) || vendorId <= 0) {
    return empty;
  }

  const params = new URLSearchParams({
    page: String(filters.page),
    per_page: String(filters.perPage),
    status: filters.status,
  });
  if (filters.search) {
    params.set("search", filters.search);
  }

  const result = await wpRest<RawOrdersSnapshot>(
    `/papelito/v1/admin/vendors/${vendorId}/orders?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!result.ok) {
    return empty;
  }

  return {
    items: (result.data.items ?? []).map((item) => ({
      createdAt: item.created_at ?? "",
      customerName: item.customer_name ?? "",
      id: Number(item.id) || 0,
      itemsCount: Number(item.items_count) || 0,
      itemsLabel: item.items_label ?? "",
      orderNumber: item.order_number ?? "",
      status: normalizeOrderStatus(item.vendor_status),
      total: Number(item.total) || 0,
    })),
    page: Number(result.data.page) || filters.page,
    perPage: Number(result.data.per_page) || filters.perPage,
    total: Number(result.data.total) || 0,
    totalPages: Number(result.data.total_pages) || 1,
  };
}
