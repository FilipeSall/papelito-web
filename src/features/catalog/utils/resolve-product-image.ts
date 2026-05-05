interface ResolveProductImageInput {
  /** Imagem alternativa usada em cards da home/catálogo. */
  homeImageUrl?: string;
  /** Imagem principal do produto no catálogo. */
  productImageUrl?: string;
}

export const PRODUCT_FALLBACK_IMAGE = "/images/products/Papelito_Site_Arte_Fallback.png";

const LEGACY_IMAGE_PATHS: Record<string, string> = {
  "/images/products/Image (Brown King Size).png":
    "/images/products/sedas/SEDA DISPLAY BROWN KS 50.png",
  "/images/products/Image (Tradicional Slim).png":
    "/images/products/sedas/SEDA DISPLAY SLIM KS 50.png",
  "/images/products/Image (Hemp King Size).png":
    "/images/products/sedas/SEDA DISPLAY HEMP KS 25.png",
  "/images/products/Image (Insane Brown).png":
    "/images/products/sedas/SEDA DISPLAY INSANE BROWN.png",
  "/images/products/Image (Pink Queen Size).png":
    "/images/products/sedas/SEDA DISPLAY PINK KS 50.png",
  "/images/products/Image (Alfafa King Size).png":
    "/images/products/sedas/SEDA DISPLAY ALFAFA KS 50.png",
  "/images/products/Image (Piteira Tradicional).png":
    "/images/products/piteiras/PITEIRA PITEIRA TRADICIONAL.png",
  "/images/products/Image (Bag Tradicional).png":
    "/images/products/piteiras/PITEIRA DISPLAY - FUN TRADICIONAL.png",
};

function normalizeImagePath(value?: string) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return LEGACY_IMAGE_PATHS[trimmed] ?? trimmed;
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
  const normalizedProductImage = normalizeImagePath(productImageUrl);
  if (normalizedProductImage) {
    return normalizedProductImage;
  }

  const normalizedHomeImage = normalizeImagePath(homeImageUrl);
  if (normalizedHomeImage) {
    return normalizedHomeImage;
  }

  return undefined;
}
