import "server-only";

import { getWpRestBase } from "@/lib/server/env";
import { wpRest } from "@/lib/server/wp-rest";
import { getProductsTaxonomyMap } from "@/lib/server/admin-taxonomy";

export type AdminProductTaxonomyTerm = {
  id: number;
  name: string;
  parent: number;
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
  subcategories?: { facet: string; id: number; name: string; slug: string }[];
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

export type AdminProductTagPayload = {
  name?: string;
  slug?: string;
};

type WcProductTerm = {
  id?: number;
  name?: string;
  parent?: number;
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

type WcProductVariationBatch = {
  update?: WcProduct[] | null;
};

type WpMediaResponse = {
  alt_text?: string | null;
  id?: number;
  source_url?: string | null;
};

const DEFAULT_PER_PAGE = 20;
const VALID_STATUSES = new Set(["publish", "draft", "pending", "private"]);
const VALID_STOCK_STATUSES = new Set(["instock", "outofstock", "onbackorder"]);
function toPositiveInt(value: string | undefined, fallback: number, max?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  if (typeof max === "number") {
    return Math.min(parsed, max);
  }
  return parsed;
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
    parent: typeof term.parent === "number" ? term.parent : 0,
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

function uniformVariationValue(
  variations: WcProduct[],
  field: "regular_price" | "sale_price" | "date_on_sale_from" | "date_on_sale_to",
) {
  if (variations.length === 0) {
    return null;
  }

  const values = variations.map((variation) => cleanText(variation[field]));
  return values.every((value) => value === values[0]) ? values[0] : null;
}

function mapProductWithVariations(product: WcProduct, variations: WcProduct[]) {
  const mappedProduct = mapProduct(product);

  if (mappedProduct.type !== "variable") {
    return mappedProduct;
  }

  const regularPrice = uniformVariationValue(variations, "regular_price");
  const salePrice = uniformVariationValue(variations, "sale_price");
  const dateOnSaleFrom = uniformVariationValue(variations, "date_on_sale_from");
  const dateOnSaleTo = uniformVariationValue(variations, "date_on_sale_to");

  return {
    ...mappedProduct,
    ...(regularPrice !== null ? { regularPrice } : {}),
    ...(salePrice !== null ? { salePrice } : {}),
    ...(dateOnSaleFrom !== null ? { dateOnSaleFrom } : {}),
    ...(dateOnSaleTo !== null ? { dateOnSaleTo } : {}),
  };
}

async function getAdminProductVariations(accessToken: string, productId: number) {
  const result = await wpRest<WcProduct[]>(
    `/wc/v3/products/${productId}/variations?per_page=100&orderby=id&order=asc`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 0,
    },
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
}

function hasVariablePricingChange(payload: AdminProductPayload) {
  return (
    payload.regularPrice !== undefined ||
    payload.salePrice !== undefined ||
    payload.dateOnSaleFrom !== undefined ||
    payload.dateOnSaleTo !== undefined
  );
}

function omitVariablePricing(payload: AdminProductPayload): AdminProductPayload {
  const productPayload = { ...payload };

  delete productPayload.dateOnSaleFrom;
  delete productPayload.dateOnSaleTo;
  delete productPayload.regularPrice;
  delete productPayload.salePrice;

  return productPayload;
}

function buildVariationPricingPayload(payload: AdminProductPayload) {
  const pricing: Record<string, string | null> = {};

  if (payload.regularPrice !== undefined) pricing.regular_price = cleanText(payload.regularPrice);
  if (payload.salePrice !== undefined) pricing.sale_price = cleanText(payload.salePrice);
  if (payload.dateOnSaleFrom !== undefined) {
    pricing.date_on_sale_from = payload.dateOnSaleFrom ? cleanText(payload.dateOnSaleFrom) : null;
  }
  if (payload.dateOnSaleTo !== undefined) {
    pricing.date_on_sale_to = payload.dateOnSaleTo ? cleanText(payload.dateOnSaleTo) : null;
  }

  return pricing;
}

/**
 * Chave normalizada de uma TAG, para achar tag equivalente antes de criar outra.
 *
 * Tag continua sendo do WooCommerce — é palavra-chave de busca, não classificação.
 * A normalização aqui não tem nada a ver com a antiga whitelist de categorias.
 */
function normalizeTagKey(term: { name: string; slug: string }) {
  const base = term.slug || term.name;
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&amp;/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function matchesTagKey(term: AdminProductTaxonomyTerm, key: string) {
  return (
    normalizeTagKey(term) === key || normalizeTagKey({ ...term, slug: "" }) === key
  );
}

/**
 * Junta as tags cadastradas com as que vieram nos produtos, sem repetir.
 *
 * Categoria não passa mais por aqui: ela vem da taxonomia Papelito, onde slug é
 * único por escopo e duplicata não existe por construção.
 */
function dedupeTags(terms: AdminProductTaxonomyTerm[]) {
  const byKey = new Map<string, AdminProductTaxonomyTerm>();

  for (const term of terms) {
    const key = normalizeTagKey(term);
    if (!byKey.has(key)) {
      byKey.set(key, term);
    }
  }

  return Array.from(byKey.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR"),
  );
}

function mapTaxonomyTerm(term: WcProductTerm): AdminProductTaxonomyTerm | null {
  return mapTerm(term);
}

function buildProductsQuery(filters: AdminProductsFilters) {
  const params = new URLSearchParams({
    order: "desc",
    orderby: "modified",
    page: String(toPositiveInt(filters.page, 1, 100)),
    per_page: String(toPositiveInt(filters.perPage, DEFAULT_PER_PAGE, 100)),
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

  // `papelito_category` é entendido pela REST do WooCommerce graças a um filtro
  // registrado no plugin. Assim o painel nunca precisa saber que `product_cat`
  // existe, e a paginação continua acontecendo no banco.
  const category = toPositiveInt(filters.category, 0);
  if (category > 0) {
    params.set("papelito_category", String(category));
  }

  return params;
}

function setDefinedPayloadValue(
  body: Record<string, unknown>,
  key: string,
  value: unknown,
  transform: (value: unknown) => unknown = (value) => value,
) {
  if (value !== undefined) {
    body[key] = transform(value);
  }
}

function cleanNullableText(value: unknown) {
  return value ? cleanText(value) : null;
}

function finiteNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((id): id is number => Number.isInteger(id) && id > 0)
    .map((id) => ({ id }));
}

function imagePayload(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((id): id is number => Number.isInteger(id) && id > 0)
    .map((id, position) => ({ id, position }));
}

function addWooProductFields(body: Record<string, unknown>, payload: AdminProductPayload) {
  setDefinedPayloadValue(body, "name", payload.name, cleanText);
  setDefinedPayloadValue(body, "slug", payload.slug, cleanText);
  setDefinedPayloadValue(body, "sku", payload.sku, cleanText);
  setDefinedPayloadValue(body, "status", payload.status, (value) => cleanText(value) || "draft");
  setDefinedPayloadValue(body, "regular_price", payload.regularPrice, cleanText);
  setDefinedPayloadValue(body, "sale_price", payload.salePrice, cleanText);
  setDefinedPayloadValue(body, "date_on_sale_from", payload.dateOnSaleFrom, cleanNullableText);
  setDefinedPayloadValue(body, "date_on_sale_to", payload.dateOnSaleTo, cleanNullableText);
}

function addWooStockFields(body: Record<string, unknown>, payload: AdminProductPayload) {
  setDefinedPayloadValue(body, "manage_stock", payload.manageStock, Boolean);
  setDefinedPayloadValue(body, "stock_quantity", payload.stockQuantity, finiteNumberOrNull);
  setDefinedPayloadValue(body, "stock_status", payload.stockStatus, cleanText);
  setDefinedPayloadValue(body, "weight", payload.weight, cleanText);
}

function addWooDimensions(body: Record<string, unknown>, payload: AdminProductPayload) {
  if (payload.dimensions !== undefined) {
    body.dimensions = {
      height: cleanText(payload.dimensions.height),
      length: cleanText(payload.dimensions.length),
      width: cleanText(payload.dimensions.width),
    };
  }
}

function addWooProductContent(body: Record<string, unknown>, payload: AdminProductPayload) {
  setDefinedPayloadValue(body, "short_description", payload.shortDescription);
  setDefinedPayloadValue(body, "description", payload.description);
}

function addWooProductTaxonomies(body: Record<string, unknown>, payload: AdminProductPayload) {
  setDefinedPayloadValue(body, "categories", payload.categories, positiveIds);
  setDefinedPayloadValue(body, "tags", payload.tags, positiveIds);
  setDefinedPayloadValue(
    body,
    "images",
    payload.images,
    imagePayload,
  );
}

function buildWooProductPayload(payload: AdminProductPayload) {
  const body: Record<string, unknown> = {};

  addWooProductFields(body, payload);
  addWooStockFields(body, payload);
  addWooDimensions(body, payload);
  addWooProductContent(body, payload);
  addWooProductTaxonomies(body, payload);

  return body;
}

export async function getAdminProductsSnapshot(
  accessToken: string | undefined,
  filters: AdminProductsFilters = {},
): Promise<AdminProductsSnapshot> {
  const page = toPositiveInt(filters.page, 1, 100);
  const perPage = toPositiveInt(filters.perPage, DEFAULT_PER_PAGE, 100);

  if (!accessToken) {
    return {
        currentPage: page,
      issues: ["Sessão sem access token para consultar produtos do WooCommerce."],
      perPage,
      products: [],
      tags: [],
      totalPages: 0,
      totalProducts: 0,
    };
  }

  const productQuery = buildProductsQuery(filters);
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [productsResult, tagsResult] = await Promise.all([
    wpRest<WcProduct[]>(`/wc/v3/products?${productQuery.toString()}`, {
      headers,
      revalidate: 300,
      tags: ["admin-products", "wp:products"],
    }),
    // Tag continua sendo do WooCommerce: é palavra-chave de busca, não
    // classificação. Categoria vem da taxonomia Papelito.
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

  const rawTags = tagsResult.ok
    ? tagsResult.data.map(mapTaxonomyTerm).filter(Boolean) as AdminProductTaxonomyTerm[]
    : [];
  const rawProducts = productsResult.ok
    ? productsResult.data
        .map(mapProduct)
        .filter((product) => product.id > 0)
    : [];
  const tags = dedupeTags([
    ...rawTags,
    ...rawProducts.flatMap((product) => product.tags),
  ]);

  if (productsResult.ok) {
    // Os chips da lista vêm da taxonomia Papelito, não de `product_cat`.
    const taxonomyByProduct = await getProductsTaxonomyMap(
      accessToken,
      rawProducts.map((product) => product.id),
    );

    products = rawProducts.map((product) => {
      const entry = taxonomyByProduct[String(product.id)];

      return {
        ...product,
        categories: entry?.category
          ? [{ id: entry.category.id, name: entry.category.name, parent: 0, slug: entry.category.slug }]
          : [],
        subcategories: entry?.subcategories ?? [],
      };
    });
    totalProducts = Number.parseInt(productsResult.headers.get("X-WP-Total") ?? "0", 10) || products.length;
    totalPages = Number.parseInt(productsResult.headers.get("X-WP-TotalPages") ?? "0", 10) || 1;
  } else {
    issues.push(`[woo] products -> ${productsResult.error.message}`);
  }

  if (!tagsResult.ok) {
    issues.push(`[woo] tags -> ${tagsResult.error.message}`);
  }

  return {
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

export async function getAdminProduct(accessToken: string, productId: number) {
  const result = await wpRest<WcProduct>(`/wc/v3/products/${productId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 0,
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const product = mapProduct(result.data);

  if (product.type !== "variable") {
    return product;
  }

  const variations = await getAdminProductVariations(accessToken, productId);
  return mapProductWithVariations(result.data, variations);
}

export async function updateAdminProduct(
  accessToken: string,
  productId: number,
  payload: AdminProductPayload,
) {
  const existingResult = await wpRest<WcProduct>(`/wc/v3/products/${productId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 0,
  });

  if (!existingResult.ok) {
    throw new Error(existingResult.error.message);
  }

  const isVariableProduct = mapProduct(existingResult.data).type === "variable";
  const productPayload = isVariableProduct ? omitVariablePricing(payload) : payload;
  const hasProductChanges = Object.keys(productPayload).length > 0;
  let updatedProduct = existingResult.data;

  if (hasProductChanges) {
    const result = await wpRest<WcProduct>(`/wc/v3/products/${productId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      json: buildWooProductPayload(productPayload),
      method: "PUT",
    });

    if (!result.ok) {
      throw new Error(result.error.message);
    }

    updatedProduct = result.data;
  }

  if (!isVariableProduct) {
    return mapProduct(updatedProduct);
  }

  if (!hasVariablePricingChange(payload)) {
    const variations = await getAdminProductVariations(accessToken, productId);
    return mapProductWithVariations(updatedProduct, variations);
  }

  const variations = await getAdminProductVariations(accessToken, productId);
  const variationPricing = buildVariationPricingPayload(payload);
  const batchResult = await wpRest<WcProductVariationBatch>(
    `/wc/v3/products/${productId}/variations/batch`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      json: {
        update: variations
          .filter((variation) => typeof variation.id === "number" && variation.id > 0)
          .map((variation) => ({ id: variation.id, ...variationPricing })),
      },
      method: "PUT",
    },
  );

  if (!batchResult.ok) {
    throw new Error(batchResult.error.message);
  }

  const updatedVariations = batchResult.data.update ?? [];
  return mapProductWithVariations(updatedProduct, updatedVariations);
}

export async function createAdminProductTag(
  accessToken: string,
  payload: AdminProductTagPayload,
) {
  const name = cleanText(payload.name);
  const slug = cleanText(payload.slug);

  if (!name) {
    throw new Error("Nome da tag e obrigatório.");
  }

  const tagKey = normalizeTagKey({ name, slug: "" });
  const tagSearch = new URLSearchParams({
    order: "asc",
    orderby: "name",
    per_page: "100",
    search: name,
  });
  const findExistingTag = async () => {
    const existingResult = await wpRest<WcProductTerm[]>(
      `/wc/v3/products/tags?${tagSearch.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!existingResult.ok) {
      throw new Error(existingResult.error.message);
    }

    return existingResult.data
      .map(mapTaxonomyTerm)
      .filter(Boolean)
      .find((term) => matchesTagKey(term as AdminProductTaxonomyTerm, tagKey)) ?? null;
  };

  const existingTag = await findExistingTag();

  if (existingTag) {
    return existingTag;
  }

  const result = await wpRest<WcProductTerm>("/wc/v3/products/tags", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: {
      name,
      ...(slug ? { slug } : {}),
    },
  });

  if (!result.ok) {
    if (result.status === 400 || result.status === 409) {
      const concurrentlyCreatedTag = await findExistingTag();

      if (concurrentlyCreatedTag) {
        return concurrentlyCreatedTag;
      }
    }

    throw new Error(result.error.message);
  }

  const tag = mapTaxonomyTerm(result.data);

  if (!tag) {
    throw new Error("WooCommerce não retornou a tag criada.");
  }

  return tag;
}

export class AdminProductMediaUploadError extends Error {
  constructor(
    readonly status: number,
    readonly wordpressCode: string | null,
    readonly wordpressMessage: string | null = null,
  ) {
    super("WordPress não conseguiu armazenar a imagem.");
  }
}

export function isAdminProductMediaUploadError(
  error: unknown,
): error is AdminProductMediaUploadError {
  return error instanceof AdminProductMediaUploadError;
}

export async function uploadAdminProductMedia(
  accessToken: string,
  file: File,
  options: { contentType?: string; fileName?: string } = {},
) {
  const safeName =
    options.fileName ?? (file.name.replace(/[^\w.\-]+/g, "-") || "produto.jpg");
  const upload =
    options.contentType && options.contentType !== file.type
      ? new File([file], safeName, { type: options.contentType })
      : file;
  const url = `${getWpRestBase().replace(/\/$/, "")}/wp/v2/media`;
  const body = new FormData();
  body.append("file", upload, safeName);
  const response = await fetch(url, {
    body,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
  });

  const json = (await response.json().catch(() => null)) as
    | WpMediaResponse
    | { code?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new AdminProductMediaUploadError(
      response.status,
      json && "code" in json && typeof json.code === "string" ? json.code : null,
      json && "message" in json && typeof json.message === "string" ? json.message : null,
    );
  }

  const media = json as WpMediaResponse | null;

  return {
    alt: media?.alt_text ?? "",
    id: typeof media?.id === "number" ? media.id : 0,
    src: media?.source_url ?? "",
  };
}
