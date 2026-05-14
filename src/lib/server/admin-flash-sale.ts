import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { AdminProductTaxonomyTerm } from "@/lib/server/admin-products";

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
      issues: ["Sessao sem access token para consultar campanha de oferta relampago."],
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
