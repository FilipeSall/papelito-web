export interface FavoriteProductItem {
  productId: string;
  addedAt: string;
  category: string;
  name: string;
  slug: string;
  image?: string;
  price: number;
  originalPrice: number;
  stockStatus: string;
}

export interface FavoritesPayload {
  items: FavoriteProductItem[];
  count: number;
}

export interface FavoriteMutationResult {
  success: boolean;
  isFavorite: boolean;
  favoritesCount: number;
  productId: number;
}
