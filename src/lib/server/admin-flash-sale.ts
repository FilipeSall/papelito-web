import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { AdminProduct, AdminProductTaxonomyTerm } from "@/lib/server/admin-products";

type WcProductTerm = {
  id?: number;
  name?: string;
  parent?: number;
  slug?: string;
};

type WpFlashSaleCampaign = {
  title?: string;
  slug?: string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  productIds?: number[];
  discountPercent?: number;
  label?: string;
  supportingText?: string;
};

type WpFlashSaleProduct = {
  id?: string;
  productId?: number;
  name?: string;
  sku?: string;
  category?: string;
  badge?: string;
  discount?: number;
  originalPrice?: number;
  price?: number;
  rating?: number;
  reviews?: number;
  image?: string;
  permalink?: string;
  status?: string;
  hasImage?: boolean;
};

type WpAdminFlashSaleSnapshot = {
  campaign?: WpFlashSaleCampaign | null;
  selectedProducts?: WpFlashSaleProduct[];
  issues?: string[];
};

type WpFlashSaleCandidate = {
  id?: number;
  name?: string;
  sku?: string;
  status?: string;
  type?: string;
  price?: string;
  regularPrice?: string;
  permalink?: string;
  weight?: string;
  stockStatus?: string;
  stockQuantity?: number | null;
  dateModified?: string;
  images?: Array<{ id?: number; src?: string; alt?: string; position?: number }>;
  categories?: WcProductTerm[];
  tags?: WcProductTerm[];
};

type WpFlashSaleProductsSnapshot = {
  items?: WpFlashSaleCandidate[];
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
};

export type AdminFlashSaleCampaign = {
  title: string;
  slug: string;
  status: string;
  startsAt: string;
  endsAt: string;
  productIds: number[];
  discountPercent: number;
};

export type AdminFlashSaleProduct = {
  id: string;
  productId: number;
  name: string;
  sku: string;
  category: string;
  badge: string;
  discount: number;
  originalPrice: number;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  hasImage: boolean;
  permalink: string;
  status: string;
};

export type AdminFlashSaleSnapshot = {
  campaign: AdminFlashSaleCampaign | null;
  selectedProducts: AdminFlashSaleProduct[];
  issues: string[];
};

export type AdminFlashSalePayload = {
  title: string;
  startsAt: string;
  endsAt: string;
  productIds: number[];
  discountPercent: number;
};

export type AdminFlashSaleProductsSnapshot = {
  items: AdminProduct[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  issues: string[];
};

export type AdminFlashSaleProductsFilters = {
  category?: string;
  page?: string;
  perPage?: string;
  search?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clampDiscount(value: unknown) {
  const numeric = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.min(99, Math.max(0, numeric));
}

function mapCampaign(campaign: WpFlashSaleCampaign | null | undefined): AdminFlashSaleCampaign | null {
  if (!campaign) {
    return null;
  }

  const title = cleanText(campaign.title);
  const startsAt = cleanText(campaign.starts_at);
  const endsAt = cleanText(campaign.ends_at);
  const productIds = Array.isArray(campaign.productIds)
    ? campaign.productIds.filter((id) => Number.isInteger(id) && id > 0)
    : [];
  const discountPercent = clampDiscount(campaign.discountPercent);

  if (!title && !startsAt && !endsAt && productIds.length === 0 && discountPercent === 0) {
    return null;
  }

  return {
    title,
    slug: cleanText(campaign.slug) || "oferta-relampago",
    status: cleanText(campaign.status) || "draft",
    startsAt,
    endsAt,
    productIds,
    discountPercent,
  };
}

function mapProduct(product: WpFlashSaleProduct): AdminFlashSaleProduct | null {
  const productId = toNumber(product.productId);
  const id = cleanText(product.id) || String(productId);

  if (!productId || !id) {
    return null;
  }

  const image = cleanText(product.image);

  return {
    id,
    productId,
    name: cleanText(product.name) || "Produto sem nome",
    sku: cleanText(product.sku),
    category: cleanText(product.category) || "Produto",
    badge: cleanText(product.badge) || "Destaque",
    discount: toNumber(product.discount),
    originalPrice: toNumber(product.originalPrice),
    price: toNumber(product.price),
    rating: toNumber(product.rating),
    reviews: toNumber(product.reviews),
    image,
    hasImage: typeof product.hasImage === "boolean" ? product.hasImage : image.length > 0,
    permalink: cleanText(product.permalink),
    status: cleanText(product.status) || "draft",
  };
}

function mapCandidateTerm(term: WcProductTerm): AdminProductTaxonomyTerm | null {
  const id = toNumber(term.id);
  if (id <= 0) return null;
  return {
    id,
    name: cleanText(term.name),
    parent: toNumber(term.parent),
    slug: cleanText(term.slug),
  };
}

function mapCandidate(product: WpFlashSaleCandidate): AdminProduct | null {
  const id = toNumber(product.id);
  if (id <= 0) return null;

  return {
    categories: (product.categories ?? [])
      .map(mapCandidateTerm)
      .filter((term): term is AdminProductTaxonomyTerm => term !== null),
    dateModified: cleanText(product.dateModified),
    dateOnSaleFrom: "",
    dateOnSaleTo: "",
    description: "",
    dimensions: { height: "", length: "", width: "" },
    id,
    images: (product.images ?? [])
      .map((image, position) => ({
        alt: cleanText(image.alt),
        id: toNumber(image.id),
        position: typeof image.position === "number" ? image.position : position,
        src: cleanText(image.src),
      }))
      .filter((image) => image.id > 0 || image.src.length > 0),
    manageStock: typeof product.stockQuantity === "number",
    name: cleanText(product.name) || "Produto sem nome",
    permalink: cleanText(product.permalink),
    price: cleanText(product.price),
    regularPrice: cleanText(product.regularPrice),
    salePrice: "",
    shortDescription: "",
    sku: cleanText(product.sku),
    slug: "",
    status: cleanText(product.status) || "publish",
    stockQuantity: typeof product.stockQuantity === "number" ? product.stockQuantity : null,
    stockStatus: cleanText(product.stockStatus) || "instock",
    tags: (product.tags ?? [])
      .map(mapCandidateTerm)
      .filter((term): term is AdminProductTaxonomyTerm => term !== null),
    type: cleanText(product.type) || "simple",
    weight: cleanText(product.weight),
  };
}

function mapSnapshot(payload: WpAdminFlashSaleSnapshot | null | undefined): AdminFlashSaleSnapshot {
  return {
    campaign: mapCampaign(payload?.campaign),
    selectedProducts: Array.isArray(payload?.selectedProducts)
      ? payload.selectedProducts.map(mapProduct).filter((item): item is AdminFlashSaleProduct => item !== null)
      : [],
    issues: Array.isArray(payload?.issues)
      ? payload.issues.filter((issue): issue is string => typeof issue === "string" && issue.length > 0)
      : [],
  };
}

export async function getAdminFlashSaleSnapshot(
  accessToken: string | undefined,
): Promise<AdminFlashSaleSnapshot> {
  if (!accessToken) {
    return {
      campaign: null,
      selectedProducts: [],
      issues: ["Sessão sem access token para consultar campanha de oferta relâmpago."],
    };
  }

  const result = await wpRest<WpAdminFlashSaleSnapshot>("/papelito/v1/admin/flash-sale", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-flash-sale"],
  });

  if (!result.ok) {
    return {
      campaign: null,
      selectedProducts: [],
      issues: [result.error.message],
    };
  }

  return mapSnapshot(result.data);
}

export async function saveAdminFlashSale(accessToken: string, payload: AdminFlashSalePayload) {
  const result = await wpRest<WpAdminFlashSaleSnapshot>("/papelito/v1/admin/flash-sale", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: payload,
    method: "PUT",
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapSnapshot(result.data);
}

export async function getFlashSaleProductCategories(
  accessToken: string | undefined,
): Promise<AdminProductTaxonomyTerm[]> {
  if (!accessToken) {
    return [];
  }

  const result = await wpRest<WcProductTerm[]>(
    "/wc/v3/products/categories?per_page=100&orderby=name&order=asc&hide_empty=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 300,
      tags: ["admin-product-categories-all"],
    },
  );

  if (!result.ok) {
    return [];
  }

  return result.data
    .map((term) => {
      const id = typeof term.id === "number" ? term.id : 0;
      if (id <= 0) {
        return null;
      }
      return {
        id,
        name: typeof term.name === "string" ? term.name : "",
        parent: typeof term.parent === "number" ? term.parent : 0,
        slug: typeof term.slug === "string" ? term.slug : "",
      } satisfies AdminProductTaxonomyTerm;
    })
    .filter((term): term is AdminProductTaxonomyTerm => term !== null)
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

export async function getAdminFlashSaleProducts(
  accessToken: string | undefined,
  filters: AdminFlashSaleProductsFilters = {},
): Promise<AdminFlashSaleProductsSnapshot> {
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, Number.parseInt(filters.perPage ?? "24", 10) || 24));

  if (!accessToken) {
    return {
      items: [],
      page,
      perPage,
      total: 0,
      totalPages: 1,
      issues: ["Sessão sem access token para consultar produtos elegiveis."],
    };
  }

  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  const search = cleanText(filters.search);
  const category = cleanText(filters.category);
  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const result = await wpRest<WpFlashSaleProductsSnapshot>(
    `/papelito/v1/admin/flash-sale/products?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      revalidate: 0,
    },
  );

  if (!result.ok) {
    return {
      items: [],
      page,
      perPage,
      total: 0,
      totalPages: 1,
      issues: [result.error.message],
    };
  }

  return {
    items: (result.data.items ?? [])
      .map(mapCandidate)
      .filter((item): item is AdminProduct => item !== null),
    page: toNumber(result.data.page) || page,
    perPage: toNumber(result.data.perPage) || perPage,
    total: toNumber(result.data.total),
    totalPages: Math.max(1, toNumber(result.data.totalPages)),
    issues: [],
  };
}

export async function deleteAdminFlashSale(accessToken: string) {
  const result = await wpRest<WpAdminFlashSaleSnapshot>("/papelito/v1/admin/flash-sale", {
    headers: { Authorization: `Bearer ${accessToken}` },
    method: "DELETE",
  });

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return mapSnapshot(result.data);
}
