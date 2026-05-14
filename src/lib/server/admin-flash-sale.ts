import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

type WpFlashSaleCampaign = {
  title?: string;
  slug?: string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  productIds?: number[];
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
  label: string;
  supportingText: string;
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
  label: string;
  supportingText: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapCampaign(campaign: WpFlashSaleCampaign | null | undefined): AdminFlashSaleCampaign | null {
  if (!campaign) {
    return null;
  }

  const title = cleanText(campaign.title);

  if (!title) {
    return null;
  }

  return {
    title,
    slug: cleanText(campaign.slug),
    status: cleanText(campaign.status) || "draft",
    startsAt: cleanText(campaign.starts_at),
    endsAt: cleanText(campaign.ends_at),
    productIds: Array.isArray(campaign.productIds)
      ? campaign.productIds.filter((id) => Number.isInteger(id) && id > 0)
      : [],
    label: cleanText(campaign.label) || "Oferta Relampago",
    supportingText: cleanText(campaign.supportingText),
  };
}

function mapProduct(product: WpFlashSaleProduct): AdminFlashSaleProduct | null {
  const productId = toNumber(product.productId);
  const id = cleanText(product.id) || String(productId);

  if (!productId || !id) {
    return null;
  }

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
    image: cleanText(product.image),
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
