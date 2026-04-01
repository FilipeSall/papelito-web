import { cache } from "react";
import { getHomeProducts } from "../services/get-home-products";

// TODO: Revisar estratégia de cache quando a API real estiver disponível
// (revalidate, tags e invalidação por evento de catálogo).
const getCachedHomeProducts = cache(getHomeProducts);

export async function useHomeProducts() {
  return getCachedHomeProducts();
}
