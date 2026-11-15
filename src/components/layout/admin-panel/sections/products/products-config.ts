export const PRODUCTS_PATH = "/admin/products";

/** Abas de Produtos. `expoday` é temporária: só existe enquanto a venda do estande não termina. */
export type ProductsTab = "products" | "kits" | "brindes" | "assets" | "expoday";

/**
 * `benefits` era o nome da terceira aba antes de a área ganhar arquitetura própria. Continua
 * sendo aceito na URL para não quebrar link salvo ou notificação antiga.
 */
export function parseProductsTab(value: string | undefined): ProductsTab {
  if (value === "kits") {
    return "kits";
  }

  if (value === "brindes") {
    return "brindes";
  }

  if (value === "assets" || value === "benefits") {
    return "assets";
  }

  if (value === "expoday") {
    return "expoday";
  }

  return "products";
}

export function productsHref(tab: ProductsTab) {
  return tab === "products" ? PRODUCTS_PATH : `${PRODUCTS_PATH}?tab=${tab}`;
}
