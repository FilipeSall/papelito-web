import type { AdminProductImage } from "@/lib/server/admin-products";

export type ProductDraft = {
  categoryIds: string[];
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

export type DraftTermKey = "categoryIds" | "tagIds";
