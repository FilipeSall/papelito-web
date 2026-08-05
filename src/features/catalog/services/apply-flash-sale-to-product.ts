import type { HomeFlashSaleCampaign, HomeProductCard } from "../types/home-products";
import type { ProductDetailItem, ProductDetailRelatedThumb } from "../types/product-detail";
import type { ProductsCatalogItem } from "../types/products-catalog";

export function findCampaignProduct(
  productId: string,
  campaign: HomeFlashSaleCampaign | null,
) {
  return campaign?.products.find((product) => product.id === productId) ?? null;
}

export function applyFlashSaleToHomeProductCard(
  product: HomeProductCard,
  campaign: HomeFlashSaleCampaign | null,
): HomeProductCard {
  const campaignProduct = findCampaignProduct(product.id, campaign);

  if (!campaignProduct) {
    return product;
  }

  return {
    ...product,
    originalPrice: campaignProduct.originalPrice,
    price: campaignProduct.price,
    discount: campaignProduct.discount,
    promotionContext: campaignProduct.promotionContext,
  };
}

export function applyFlashSaleToCatalogItem(
  product: ProductsCatalogItem,
  campaign: HomeFlashSaleCampaign | null,
): ProductsCatalogItem {
  const campaignProduct = findCampaignProduct(product.id, campaign);

  if (!campaignProduct) {
    return product;
  }

  return {
    ...product,
    originalPrice: campaignProduct.originalPrice,
    price: campaignProduct.price,
    isOnSale: campaignProduct.discount > 0,
    promotionContext: campaignProduct.promotionContext,
  };
}

function applyFlashSaleToRelatedThumbs(
  thumbs: ProductDetailRelatedThumb[],
  campaign: HomeFlashSaleCampaign | null,
): ProductDetailRelatedThumb[] {
  const merged = thumbs.map((thumb) => {
    const campaignProduct = findCampaignProduct(thumb.id, campaign);
    return campaignProduct ? { ...thumb, price: campaignProduct.price } : thumb;
  });

  return merged.some((thumb, index) => thumb !== thumbs[index]) ? merged : thumbs;
}

export function applyFlashSaleToProductDetail(
  product: ProductDetailItem,
  campaign: HomeFlashSaleCampaign | null,
): ProductDetailItem {
  const campaignProduct = findCampaignProduct(product.id, campaign);
  const relatedThumbs = applyFlashSaleToRelatedThumbs(product.relatedThumbs, campaign);

  if (!campaignProduct) {
    return relatedThumbs === product.relatedThumbs ? product : { ...product, relatedThumbs };
  }

  return {
    ...product,
    originalPrice: campaignProduct.originalPrice,
    price: campaignProduct.price,
    discountPercent: campaignProduct.discount,
    promotionContext: campaignProduct.promotionContext,
    relatedThumbs,
  };
}
