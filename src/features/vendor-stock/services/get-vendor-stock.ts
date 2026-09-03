import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import { VENDOR_STOCK_DEFAULT_PER_PAGE } from "../types/vendor-stock";
import type {
  VendorStockFilters,
  VendorStockKit,
  VendorStockMissingField,
  VendorStockSnapshot,
  VendorStockTerm,
} from "../types/vendor-stock";

const MISSING_FIELDS: VendorStockMissingField[] = [
  "image",
  "price",
  "weight",
  "dimensions",
  "category",
];

/**
 * Campo desconhecido é descartado: o front não inventa exigência que o backend não afirmou.
 *
 * O `fallback` cobre a resposta que ainda não traz `missing_fields` — cache de trinta segundos ou
 * WordPress anterior a este contrato. Sem ele o aviso de peso desapareceria da linha justamente
 * na janela de rollout, e o vendor concluiria que o produto está publicável.
 */
function mapMissingFields(
  raw: unknown,
  isPubliclyViewable: boolean,
): VendorStockMissingField[] {
  if (!Array.isArray(raw)) {
    return isPubliclyViewable ? [] : ["weight"];
  }

  return MISSING_FIELDS.filter((field) => raw.includes(field));
}

type WpTerm = { id?: number; name?: string; slug?: string };

type WpKitItem = {
  image_url?: string;
  is_zeroed?: boolean;
  product_id?: number;
  product_name?: string;
  qty?: number;
  quantity?: number;
  sku?: string;
};

type WpKit = {
  assemblable_qty?: number;
  items?: WpKitItem[];
  kit_id?: number;
  slug?: string;
};

type WpStockResponse = {
  items?: Array<{
    categories?: WpTerm[];
    is_publicly_viewable?: boolean;
    is_unconfigured?: boolean;
    is_zeroed?: boolean;
    image_url?: string;
    kit?: WpKit | null;
    missing_fields?: unknown;
    product_id?: number;
    public_product_id?: number;
    product_name?: string;
    qty?: number;
    sku?: string;
    tags?: WpTerm[];
    updated_at?: string;
  }>;
  low_stock_threshold?: number;
  page?: number;
  per_page?: number;
  total?: number;
};

/** Usado só quando a resposta do WordPress não traz o limite — nunca como regra do front. */
const FALLBACK_LOW_STOCK_THRESHOLD = 5;

function mapKit(raw?: WpKit | null): VendorStockKit | null {
  const kitId = Number(raw?.kit_id) || 0;

  if (!raw || kitId <= 0) {
    return null;
  }

  return {
    assemblableQty: Number(raw.assemblable_qty) || 0,
    items: (raw.items ?? [])
      .map((item) => ({
        imageUrl: item.image_url ?? "",
        isZeroed: Boolean(item.is_zeroed),
        productId: Number(item.product_id) || 0,
        productName: item.product_name ?? "Produto",
        quantity: Number(item.quantity) || 0,
        qty: Number(item.qty) || 0,
        sku: item.sku ?? "",
      }))
      .filter((item) => item.productId > 0),
    kitId,
    slug: raw.slug ?? "",
  };
}

function mapTerms(raw?: WpTerm[]): VendorStockTerm[] {
  return (raw ?? [])
    .map((term) => ({
      id: Number(term.id) || 0,
      name: term.name ?? "",
      slug: term.slug ?? "",
    }))
    .filter((term) => term.id > 0);
}

export async function getVendorStock(
  filters: VendorStockFilters & { page: number },
): Promise<VendorStockSnapshot> {
  const accessToken = await getSellerAccessToken();
  const perPage = filters.perPage || VENDOR_STOCK_DEFAULT_PER_PAGE;
  const empty = {
    items: [],
    lowStockThreshold: FALLBACK_LOW_STOCK_THRESHOLD,
    page: filters.page,
    perPage,
    total: 0,
  };

  if (!accessToken) {
    return empty;
  }

  const params = new URLSearchParams({
    filter: filters.filter,
    page: String(filters.page),
    per_page: String(perPage),
    sort: filters.sort,
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.category && filters.category > 0) params.set("category", String(filters.category));
  if (filters.tags.length > 0) params.set("tags", filters.tags.join(","));
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.type !== "products") params.set("type", filters.type);

  const result = await wpRest<WpStockResponse>(`/papelito/v1/vendor/me/stock?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["vendor-stock"],
  });

  if (!result.ok) {
    return empty;
  }

  return {
    items: (result.data.items ?? []).map((item) => ({
      categories: mapTerms(item.categories),
      imageUrl: item.image_url ?? "",
      isPubliclyViewable: item.is_publicly_viewable !== false,
      isUnconfigured: Boolean(item.is_unconfigured),
      isZeroed: Boolean(item.is_zeroed),
      missingFields: mapMissingFields(
        item.missing_fields,
        item.is_publicly_viewable !== false,
      ),
      kit: mapKit(item.kit),
      productId: Number(item.product_id) || 0,
      publicProductId: Number(item.public_product_id) || Number(item.product_id) || 0,
      productName: item.product_name ?? "Produto",
      qty: Number(item.qty) || 0,
      sku: item.sku ?? "",
      tags: mapTerms(item.tags),
      updatedAt: item.updated_at ?? "",
    })),
    lowStockThreshold:
      Number(result.data.low_stock_threshold) || FALLBACK_LOW_STOCK_THRESHOLD,
    page: Number(result.data.page) || filters.page,
    // O WordPress é quem manda no tamanho aplicado: ele corta em 100, e a paginação tem que
    // contar com o que ele devolveu, não com o que o front pediu.
    perPage: Number(result.data.per_page) || perPage,
    total: Number(result.data.total) || 0,
  };
}
