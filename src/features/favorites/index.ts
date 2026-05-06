export type {
  FavoriteMutationResult,
  FavoriteProductItem,
  FavoritesPayload,
} from "./types/favorites";
export {
  addFavoriteProduct,
  fetchFavorites,
  fetchProductFavoriteStatus,
  removeFavoriteProduct,
} from "./server/favorites";
