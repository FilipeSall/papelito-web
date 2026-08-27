import "server-only";

import type { ProductDetailItem } from "../types/product-detail";
import { PRODUCT_FALLBACK_IMAGE } from "../utils/resolve-product-image";
import { calculateDiscountPercent } from "../utils/discount-percent";
import { wpRest } from "@/lib/server/wp-rest";

type KitDetailResponse = {
  productId?: number;
  name?: string;
  slug?: string;
  price?: string;
  salePrice?: string;
  imageUrl?: string;
  shortDescription?: string;
  description?: string;
  galleryImages?: Array<{ id?: string; name?: string; image?: string }>;
};

function price(value: string | undefined) {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function getKitDetail(slug: string): Promise<ProductDetailItem | null> {
  const result = await wpRest<KitDetailResponse>(
    `/papelito/v1/kits/${encodeURIComponent(slug)}`,
    { revalidate: 60, tags: ["wp:kits", `wp:kit:${slug}`] },
  );
  if (!result.ok || !Number.isInteger(result.data.productId) || !result.data.name) {
    return null;
  }

  const originalPrice = price(result.data.price);
  const salePrice = price(result.data.salePrice);
  const currentPrice = salePrice || originalPrice;
  const image = result.data.imageUrl || PRODUCT_FALLBACK_IMAGE;
  const galleryImages = (result.data.galleryImages ?? []).map((item, index) => ({
    id: item.id || `${result.data.productId}:gallery:${index}`,
    name: item.name || result.data.name!,
    image: item.image || PRODUCT_FALLBACK_IMAGE,
  }));

  return {
    id: String(result.data.productId),
    name: result.data.name,
    category: "Kit Papelito",
    type: "acessorios",
    badge: "Kit Papelito",
    description: result.data.shortDescription || result.data.description || "",
    longDescription: result.data.description || result.data.shortDescription || "",
    image,
    rating: 0,
    reviews: 0,
    price: currentPrice,
    originalPrice,
    discountPercent: calculateDiscountPercent(originalPrice, currentPrice),
    isKit: true,
    galleryImages: galleryImages.length > 0 ? galleryImages : [{ id: `${result.data.productId}:primary`, name: result.data.name, image }],
    relatedThumbs: [],
  };
}
