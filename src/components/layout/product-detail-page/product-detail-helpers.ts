import type {
  ProductDetailGalleryImage,
  ProductDetailItem,
} from "@/features/catalog/types/product-detail";
import { parseDescriptionParagraphs } from "@/utils/html";

export interface DescriptionParagraph {
  id: string;
  text: string;
}

const MAX_THUMBNAILS = 4;

export function resolveThumbnails(product: ProductDetailItem): ProductDetailGalleryImage[] {
  const galleryImages = product.galleryImages ?? [];
  const source =
    galleryImages.length > 0
      ? galleryImages
      : [{ id: `${product.id}:primary`, name: product.name, image: product.image }];

  return source.filter((thumb) => Boolean(thumb.image?.trim())).slice(0, MAX_THUMBNAILS);
}

export function buildDescriptionParagraphs(description: string): DescriptionParagraph[] {
  const occurrences = new Map<string, number>();

  return parseDescriptionParagraphs(description)
    .filter(Boolean)
    .map((text) => {
      const occurrence = occurrences.get(text) ?? 0;
      occurrences.set(text, occurrence + 1);

      return { id: `${occurrence}:${text}`, text };
    });
}

export function resolveAvailableStock(stockQty: number | null | undefined): number | null {
  if (typeof stockQty !== "number" || !Number.isFinite(stockQty)) {
    return null;
  }

  return Math.max(0, Math.floor(stockQty));
}

export function clampQuantity(current: number, availableStock: number | null): number {
  if (availableStock === null) {
    return current;
  }

  if (availableStock <= 0) {
    return 0;
  }

  return Math.min(Math.max(1, current), availableStock);
}

export function decreaseQuantity(current: number): number {
  return Math.max(1, current - 1);
}

export function increaseQuantity(current: number, availableStock: number | null): number {
  return availableStock === null ? current + 1 : Math.min(availableStock, current + 1);
}

export function resolveStockLabel(stockQty: number | null | undefined): string {
  if (typeof stockQty !== "number") {
    return "Estoque regional não consultado";
  }

  if (stockQty > 0) {
    return `${stockQty} em estoque`;
  }

  return "Sem estoque no vendor selecionado";
}
