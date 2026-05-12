import "server-only";

import { getWpRestBase } from "@/lib/server/env";
import { wpRest } from "@/lib/server/wp-rest";

export type AdminProductTaxonomyTerm = {
  id: number;
  name: string;
  slug: string;
};

export type AdminProductImage = {
  alt: string;
  id: number;
  position: number;
  src: string;
};

export type AdminProduct = {
  categories: AdminProductTaxonomyTerm[];
  dateModified: string;
  dateOnSaleFrom: string;
  dateOnSaleTo: string;
  description: string;
  dimensions: {
    height: string;
    length: string;
    width: string;
  };
  id: number;
  images: AdminProductImage[];
  manageStock: boolean;
  name: string;
  permalink: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  shortDescription: string;
  sku: string;
  slug: string;
  status: string;
  stockQuantity: number | null;
  stockStatus: string;
  tags: AdminProductTaxonomyTerm[];
  type: string;
  weight: string;
};

export type AdminProductsSnapshot = {
  categories: AdminProductTaxonomyTerm[];
  currentPage: number;
  issues: string[];
  perPage: number;
  products: AdminProduct[];
  tags: AdminProductTaxonomyTerm[];
  totalPages: number;
  totalProducts: number;
};

export type AdminProductsFilters = {
  category?: string;
  page?: string;
  perPage?: string;
  search?: string;
  status?: string;
  stockStatus?: string;
};

export type AdminProductPayload = {
  categories?: number[];
  dateOnSaleFrom?: string | null;
  dateOnSaleTo?: string | null;
  description?: string;
  dimensions?: {
    height?: string;
    length?: string;
    width?: string;
  };
  images?: number[];
  manageStock?: boolean;
  name?: string;
  regularPrice?: string;
  salePrice?: string;
  shortDescription?: string;
  sku?: string;
  slug?: string;
  status?: string;
  stockQuantity?: number | null;
  stockStatus?: string;
  tags?: number[];
  weight?: string;
};

type WcProductTerm = {
  id?: number;
  name?: string;
  slug?: string;
};

type WcProductImage = {
  alt?: string | null;
  id?: number;
  position?: number;
  src?: string | null;
};

type WcProduct = {
  categories?: WcProductTerm[] | null;
  date_modified?: string | null;
  date_on_sale_from?: string | null;
  date_on_sale_to?: string | null;
  description?: string | null;
  dimensions?: {
    height?: string | null;
    length?: string | null;
    width?: string | null;
  } | null;
  id?: number;
  images?: WcProductImage[] | null;
  manage_stock?: boolean;
  name?: string | null;
  permalink?: string | null;
  price?: string | null;
  regular_price?: string | null;
  sale_price?: string | null;
  short_description?: string | null;
  sku?: string | null;
  slug?: string | null;
  status?: string | null;
  stock_quantity?: number | null;
  stock_status?: string | null;
  tags?: WcProductTerm[] | null;
  type?: string | null;
  weight?: string | null;
};

type WpMediaResponse = {
  alt_text?: string | null;
  id?: number;
  source_url?: string | null;
};

const DEFAULT_PER_PAGE = 20;
const VALID_STATUSES = new Set(["publish", "draft", "pending", "private"]);
const VALID_STOCK_STATUSES = new Set(["instock", "outofstock", "onbackorder"]);

function toPositiveInt(value: string | undefined, fallback: number, max = 100) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapTerm(term: WcProductTerm): AdminProductTaxonomyTerm | null {
  if (!term.id) {
    return null;
  }

  return {
    id: term.id,
    name: cleanText(term.name),
    slug: cleanText(term.slug),
  };
}

function mapProduct(product: WcProduct): AdminProduct {
  return {
    categories: (product.categories ?? []).map(mapTerm).filter(Boolean) as AdminProductTaxonomyTerm[],
    dateModified: product.date_modified ?? "",
    dateOnSaleFrom: product.date_on_sale_from ?? "",
    dateOnSaleTo: product.date_on_sale_to ?? "",
    description: product.description ?? "",
    dimensions: {
      height: product.dimensions?.height ?? "",
      length: product.dimensions?.length ?? "",
      width: product.dimensions?.width ?? "",
    },
    id: product.id ?? 0,
    images: (product.images ?? [])
      .map((image, index) => ({
        alt: image.alt ?? "",
        id: image.id ?? 0,
        position: image.position ?? index,
        src: image.src ?? "",
      }))
      .filter((image) => image.id || image.src),
    manageStock: Boolean(product.manage_stock),
    name: product.name ?? "Produto sem nome",
    permalink: product.permalink ?? "",
    price: product.price ?? "",
    regularPrice: product.regular_price ?? "",
    salePrice: product.sale_price ?? "",
    shortDescription: product.short_description ?? "",
    sku: product.sku ?? "",
    slug: product.slug ?? "",
    status: product.status ?? "draft",
    stockQuantity: typeof product.stock_quantity === "number" ? product.stock_quantity : null,
    stockStatus: product.stock_status ?? "instock",
    tags: (product.tags ?? []).map(mapTerm).filter(Boolean) as AdminProductTaxonomyTerm[],
    type: product.type ?? "simple",
    weight: product.weight ?? "",
  };
}

function mapTaxonomyTerm(term: WcProductTerm): AdminProductTaxonomyTerm | null {
  return mapTerm(term);
}

function buildProductsQuery(filters: AdminProductsFilters) {
  const params = new URLSearchParams({
    order: "desc",
    orderby: "modified",
    page: String(toPositiveInt(filters.page, 1)),
    per_page: String(toPositiveInt(filters.perPage, DEFAULT_PER_PAGE)),
  });

  const search = cleanText(filters.search);
  if (search) {
    params.set("search", search);
  }

  const status = cleanText(filters.status).toLowerCase();
  if (VALID_STATUSES.has(status)) {
    params.set("status", status);
  }

  const stockStatus = cleanText(filters.stockStatus).toLowerCase();
  if (VALID_STOCK_STATUSES.has(stockStatus)) {
    params.set("stock_status", stockStatus);
  }

  const category = toPositiveInt(filters.category, 0);
  if (category > 0) {
    params.set("category", String(category));
  }

  return params;
}

function buildWooProductPayload(payload: AdminProductPayload) {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) body.name = cleanText(payload.name);
  if (payload.slug !== undefined) body.slug = cleanText(payload.slug);
  if (payload.sku !== undefined) body.sku = cleanText(payload.sku);
  if (payload.status !== undefined) body.status = cleanText(payload.status) || "draft";
  if (payload.regularPrice !== undefined) body.regular_price = cleanText(payload.regularPrice);
  if (payload.salePrice !== undefined) body.sale_price = cleanText(payload.salePrice);
  if (payload.dateOnSaleFrom !== undefined) {
    body.date_on_sale_from = payload.dateOnSaleFrom ? cleanText(payload.dateOnSaleFrom) : null;
  }
  if (payload.dateOnSaleTo !== undefined) {
    body.date_on_sale_to = payload.dateOnSaleTo ? cleanText(payload.dateOnSaleTo) : null;
  }
  if (payload.manageStock !== undefined) body.manage_stock = Boolean(payload.manageStock);
  if (payload.stockQuantity !== undefined) {
    body.stock_quantity =
      typeof payload.stockQuantity === "number" && Number.isFinite(payload.stockQuantity)
        ? payload.stockQuantity
        : null;
  }
  if (payload.stockStatus !== undefined) body.stock_status = cleanText(payload.stockStatus);
  if (payload.weight !== undefined) body.weight = cleanText(payload.weight);
  if (payload.dimensions !== undefined) {
    body.dimensions = {
      height: cleanText(payload.dimensions.height),
      length: cleanText(payload.dimensions.length),
      width: cleanText(payload.dimensions.width),
    };
  }
  if (payload.shortDescription !== undefined) {
    body.short_description = payload.shortDescription;
  }
  if (payload.description !== undefined) {
    body.description = payload.description;
  }
  if (payload.categories !== undefined) {
    body.categories = payload.categories
      .filter((id) => Number.isInteger(id) && id > 0)
      .map((id) => ({ id }));
  }
  if (payload.tags !== undefined) {
    body.tags = payload.tags
      .filter((id) => Number.isInteger(id) && id > 0)
      .map((id) => ({ id }));
  }
  if (payload.images !== undefined) {
    body.images = payload.images
      .filter((id) => Number.isInteger(id) && id > 0)
      .map((id, position) => ({ id, position }));
  }

  return body;
}

export async function getAdminProductsSnapshot(
  accessToken: string | undefined,
  filters: AdminProductsFilters = {},
): Promise<AdminProductsSnapshot> {
  const page = toPositiveInt(filters.page, 1);
  const perPage = toPositiveInt(filters.perPage, DEFAULT_PER_PAGE);

  if (!accessToken) {
    return {
      categories: [],
      currentPage: page,
      issues: ["Sessao sem access token para consultar produtos do WooCommerce."],
      perPage,
      products: [],
      tags: [],
      totalPages: 0,
      totalProducts: 0,
    };
  }

  const productQuery = buildProductsQuery(filters);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [productsResult, categoriesResult, tagsResult] = await Promise.all([
    wpRest<WcProduct[]>(`/wc/v3/products?${productQuery.toString()}`, {
      headers,
      revalidate: 300,
      tags: ["admin-products", "wp:products"],
    }),
    wpRest<WcProductTerm[]>("/wc/v3/products/categories?per_page=100&orderby=name&order=asc", {
      headers,
      revalidate: 300,
      tags: ["admin-product-taxonomies"],
    }),
    wpRest<WcProductTerm[]>("/wc/v3/products/tags?per_page=100&orderby=name&order=asc", {
      headers,
      revalidate: 300,
      tags: ["admin-product-taxonomies"],
    }),
  ]);

  const issues: string[] = [];
  let products: AdminProduct[] = [];
  let totalProducts = 0;
  let totalPages = 0;

  if (productsResult.ok) {
    products = productsResult.data.map(mapProduct).filter((product) => product.id > 0);
    totalProducts = Number.parseInt(productsResult.headers.get("X-WP-Total") ?? "0", 10) || products.length;
    totalPages = Number.parseInt(productsResult.headers.get("X-WP-TotalPages") ?? "0", 10) || 1;
  } else {
    issues.push(`[woo] products -> ${productsResult.error.message}`);
  }

  const categories = categoriesResult.ok
    ? categoriesResult.data.map(mapTaxonomyTerm).filter(Boolean) as AdminProductTaxonomyTerm[]
    : [];
  const tags = tagsResult.ok
    ? tagsResult.data.map(mapTaxonomyTerm).filter(Boolean) as AdminProductTaxonomyTerm[]
    : [];

  if (!categoriesResult.ok) {
    issues.push(`[woo] categories -> ${categoriesResult.error.message}`);
  }
  if (!tagsResult.ok) {
    issues.push(`[woo] tags -> ${tagsResult.error.message}`);
  }

  return {
    categories,
    currentPage: page,
    issues,
    perPage,
    products,
    tags,
    totalPages,
    totalProducts,
  };
}

export async function createAdminProduct(accessToken: string, payload: AdminProductPayload) {
  const result = await wpRest<WcProduct>("/wc/v3/products", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: buildWooProductPayload(payload),
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapProduct(result.data);
}

export async function updateAdminProduct(
  accessToken: string,
  productId: number,
  payload: AdminProductPayload,
) {
  const result = await wpRest<WcProduct>(`/wc/v3/products/${productId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: buildWooProductPayload(payload),
    method: "PUT",
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapProduct(result.data);
}

export async function uploadAdminProductMedia(accessToken: string, file: File) {
  const safeName = file.name.replace(/[^\w.\-]+/g, "-") || "produto.jpg";
  const url = `${getWpRestBase().replace(/\/$/, "")}/wp/v2/media`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const response = await fetch(url, {
    body: buffer,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Content-Type": file.type || "application/octet-stream",
    },
    method: "POST",
  });

  const json = (await response.json().catch(() => null)) as WpMediaResponse | { message?: string } | null;

  if (!response.ok) {
    const message =
      json && "message" in json && json.message
        ? json.message
        : "Nao foi possivel enviar a imagem ao WordPress.";
    throw new Error(message);
  }

  const media = json as WpMediaResponse | null;

  return {
    alt: media?.alt_text ?? "",
    id: typeof media?.id === "number" ? media.id : 0,
    src: media?.source_url ?? "",
  };
}
