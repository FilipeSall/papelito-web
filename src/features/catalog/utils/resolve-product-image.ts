interface ResolveProductImageInput {
  /** Imagem alternativa usada em cards da home/catálogo. */
  homeImageUrl?: string;
  /** Imagem principal do produto no catálogo. */
  productImageUrl?: string;
}

/**
 * Resolve a imagem do produto priorizando o caminho principal do catálogo.
 *
 * Evita usar assets auxiliares (ex.: nomes legacy) quando houver imagem
 * oficial do item disponível no payload.
 */
export function resolveProductImage({
  homeImageUrl,
  productImageUrl,
}: ResolveProductImageInput) {
  if (typeof productImageUrl === "string" && productImageUrl.trim().length > 0) {
    return productImageUrl;
  }

  if (typeof homeImageUrl === "string" && homeImageUrl.trim().length > 0) {
    return homeImageUrl;
  }

  return undefined;
}
