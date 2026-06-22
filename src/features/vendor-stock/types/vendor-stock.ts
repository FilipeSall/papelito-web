export type VendorStockFilter = "all" | "with_stock" | "zeroed_only";

export type VendorStockSort =
  | "name_asc"
  | "name_desc"
  | "qty_desc"
  | "qty_asc"
  | "updated_desc";

export type VendorStockTerm = {
  id: number;
  name: string;
  slug: string;
};

export type VendorStockItem = {
  categories: VendorStockTerm[];
  imageUrl: string;
  isPubliclyViewable: boolean;
  isZeroed: boolean;
  productId: number;
  publicProductId: number;
  productName: string;
  qty: number;
  sku: string;
  tags: VendorStockTerm[];
  updatedAt: string;
};

export type VendorStockSnapshot = {
  items: VendorStockItem[];
  page: number;
  perPage: number;
  total: number;
};

export type VendorStockFilters = {
  category: number | null;
  filter: VendorStockFilter;
  search: string;
  sort: VendorStockSort;
  tags: number[];
};

export type VendorStockTaxonomyTerm = VendorStockTerm & { count: number };

export type VendorStockTaxonomies = {
  categories: VendorStockTaxonomyTerm[];
  tags: VendorStockTaxonomyTerm[];
};

export const VENDOR_STOCK_SORTS: VendorStockSort[] = [
  "name_asc",
  "name_desc",
  "qty_desc",
  "qty_asc",
  "updated_desc",
];
