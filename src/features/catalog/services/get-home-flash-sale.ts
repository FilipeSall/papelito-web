import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type { HomeFlashSaleCampaign, HomeProductCard } from "../types/home-products";

type WpHomeFlashSaleCampaign = {
  title?: string;
  slug?: string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  productIds?: number[];
  label?: string;
  supportingText?: string;
};

type WpHomeFlashSaleProduct = {
  id?: string;
  category?: string;
  name?: string;
  badge?: string;
  discount?: number;
  originalPrice?: number;
  price?: number;
  rating?: number;
  reviews?: number;
  image?: string;
};

type WpHomeFlashSaleResponse = {
  campaign?: WpHomeFlashSaleCampaign | null;
  products?: WpHomeFlashSaleProduct[];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mapProduct(product: WpHomeFlashSaleProduct): HomeProductCard | null {
  const id = cleanText(product.id);

  if (!id) {
    return null;
  }

  return {
    id,
    category: cleanText(product.category) || "Produto",
    name: cleanText(product.name) || "Produto sem nome",
    badge: cleanText(product.badge) || "Destaque",
    discount: toNumber(product.discount),
    originalPrice: toNumber(product.originalPrice),
    price: toNumber(product.price),
    rating: toNumber(product.rating),
    reviews: toNumber(product.reviews),
    image: cleanText(product.image),
  };
}

export async function getHomeFlashSale(): Promise<HomeFlashSaleCampaign | null> {
  const result = await wpRest<WpHomeFlashSaleResponse>(
    "/papelito/v1/home/flash-sale",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-flash-sale"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[home-flash-sale] Falha ao consultar campanha publica.", result.error.message);
    }
    return null;
  }

  const campaign = result.data.campaign;
  const title = cleanText(campaign?.title);

  if (!campaign) {
    return null;
  }

  const products = Array.isArray(result.data.products)
    ? result.data.products.map(mapProduct).filter((item): item is HomeProductCard => item !== null)
    : [];

  if (products.length === 0) {
    return null;
  }

  return {
    title,
    slug: cleanText(campaign.slug) || "oferta-relampago",
    status: cleanText(campaign.status) || "active",
    startsAt: cleanText(campaign.starts_at),
    endsAt: cleanText(campaign.ends_at),
    productIds: Array.isArray(campaign.productIds)
      ? campaign.productIds.filter((id) => Number.isInteger(id) && id > 0)
      : [],
    label: cleanText(campaign.label) || "Oferta Relampago",
    supportingText: cleanText(campaign.supportingText),
    products,
  };
}
