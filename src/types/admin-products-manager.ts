import type { AdminProductImage } from "@/lib/server/admin-products";

export type ProductDraft = {
  dateOnSaleFrom: string;
  dateOnSaleTo: string;
  description: string;
  height: string;
  imageIds: string[];
  images: AdminProductImage[];
  length: string;
  name: string;
  regularPrice: string;
  salePrice: string;
  shortDescription: string;
  sku: string;
  slug: string;
  status: string;
  tagIds: string[];
  /** Coleções curadas da taxonomia Papelito (premium, kits). */
  taxonomyCollections: string[];
  /** Categoria principal da taxonomia Papelito. Vazio = produto não classificado. */
  taxonomyCategoryId: string;
  /** Subcategorias da taxonomia Papelito, todas da categoria principal. */
  taxonomySubcategoryIds: string[];
  weight: string;
  width: string;
};

export type ProductFilters = {
  category: string;
  search: string;
  status: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type ImageUploadTarget = "cover" | "secondary";

export type DraftTermKey =
  | "tagIds"
  | "taxonomyCollections"
  | "taxonomySubcategoryIds";
