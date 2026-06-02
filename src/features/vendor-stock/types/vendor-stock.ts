export type VendorStockFilter = "all" | "with_stock" | "zeroed_only";

export type VendorStockItem = {
  imageUrl: string;
  isZeroed: boolean;
  productId: number;
  productName: string;
  qty: number;
  sku: string;
  updatedAt: string;
};

export type VendorStockSnapshot = {
  items: VendorStockItem[];
  page: number;
  perPage: number;
  total: number;
};
