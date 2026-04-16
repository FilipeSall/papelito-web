import type { ProductTypeId } from "./products-catalog";

export interface ProductDetailRelatedThumb {
  id: string;
  name: string;
  image?: string;
  price: number;
}

export interface ProductDetailItem {
  id: string;
  name: string;
  category: string;
  type: Exclude<ProductTypeId, "todos">;
  badge: string;
  description: string;
  image?: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  relatedThumbs: ProductDetailRelatedThumb[];
}
