import type { HomeFlashSaleCampaign } from "../types/home-products";
import type { ProductDetailItem } from "../types/product-detail";

export function applyFlashSaleToProductDetail(
  product: ProductDetailItem,
  campaign: HomeFlashSaleCampaign | null,
): ProductDetailItem {
  const campaignProduct = campaign?.products.find((item) => item.id === product.id);

  if (!campaignProduct) {
    return product;
  }

  return {
    ...product,
    originalPrice: campaignProduct.originalPrice,
    price: campaignProduct.price,
    discountPercent: campaignProduct.discount,
    promotionContext: campaignProduct.promotionContext,
  };
}
