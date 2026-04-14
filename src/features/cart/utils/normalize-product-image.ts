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

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeProductImage(image?: string, productName?: string) {
  if (image) {
    const trimmed = image.trim();
    if (LEGACY_IMAGE_PATHS[trimmed]) {
      return LEGACY_IMAGE_PATHS[trimmed];
    }

    if (!trimmed.includes("/images/products/Image (")) {
      return trimmed;
    }
  }

  const normalizedName = normalizeText(productName ?? "");

  if (normalizedName.includes("insane brown")) {
    return "/images/products/sedas/SEDA DISPLAY INSANE BROWN.png";
  }

  if (normalizedName.includes("hemp")) {
    return "/images/products/sedas/SEDA DISPLAY HEMP KS 25.png";
  }

  if (normalizedName.includes("pink")) {
    return "/images/products/sedas/SEDA DISPLAY PINK KS 50.png";
  }

  if (normalizedName.includes("alfafa")) {
    return "/images/products/sedas/SEDA DISPLAY ALFAFA KS 50.png";
  }

  if (normalizedName.includes("brown") && normalizedName.includes("king")) {
    return "/images/products/sedas/SEDA DISPLAY BROWN KS 50.png";
  }

  if (normalizedName.includes("slim")) {
    return "/images/products/sedas/SEDA DISPLAY SLIM KS 50.png";
  }

  if (normalizedName.includes("piteira")) {
    return "/images/products/piteiras/PITEIRA PITEIRA TRADICIONAL.png";
  }

  return image;
}
