import type {
  AdminProduct,
  AdminProductTaxonomyTerm,
} from "@/lib/server/admin-products";
import {
  DEFAULT_PRODUCT_STATUS,
  FRONTEND_PRODUCT_PATH,
  PROMOTION_TAG_KEYS,
  PUBLISHED_PRODUCT_STATUS,
} from "@/constants/admin-products";
import type { ProductDraft } from "@/types/admin-products-manager";
import { hasPositiveDimension, hasPositiveWeight } from "@/utils/weight";
import { parseMoney } from "@/utils/money";
import { normalizeKey } from "@/utils/normalize-key";

import { formatCurrency } from "../../formatters";

export function toDateTimeLocal(value: string) {
  return value ? value.slice(0, 16) : "";
}

export function formatMoney(value: string) {
  const parsed = parseMoney(value);
  return parsed > 0 ? formatCurrency(parsed) : "Sem preço";
}

export function productToDraft(product: AdminProduct): ProductDraft {
  return {
    categoryIds: product.categories.map((category) => String(category.id)),
    dateOnSaleFrom: toDateTimeLocal(product.dateOnSaleFrom),
    dateOnSaleTo: toDateTimeLocal(product.dateOnSaleTo),
    description: product.description,
    height: product.dimensions.height,
    imageIds: product.images.map((image) => String(image.id)).filter((id) => id !== "0"),
    images: product.images,
    length: product.dimensions.length,
    name: product.name,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    status: product.status,
    tagIds: product.tags.map((tag) => String(tag.id)),
    weight: product.weight,
    width: product.dimensions.width,
  };
}

export function newProductDraft(): ProductDraft {
  return {
    categoryIds: [],
    dateOnSaleFrom: "",
    dateOnSaleTo: "",
    description: "",
    height: "",
    imageIds: [],
    images: [],
    length: "",
    name: "",
    regularPrice: "",
    salePrice: "",
    shortDescription: "",
    sku: "",
    slug: "",
    status: DEFAULT_PRODUCT_STATUS,
    tagIds: [],
    weight: "",
    width: "",
  };
}

export function buildPayload(draft: ProductDraft) {
  return {
    categories: draft.categoryIds.map(Number),
    dateOnSaleFrom: draft.dateOnSaleFrom || null,
    dateOnSaleTo: draft.dateOnSaleTo || null,
    description: draft.description,
    dimensions: {
      height: draft.height,
      length: draft.length,
      width: draft.width,
    },
    images: draft.imageIds.map(Number),
    name: draft.name,
    regularPrice: draft.regularPrice,
    salePrice: draft.salePrice,
    shortDescription: draft.shortDescription,
    sku: draft.sku,
    slug: draft.slug,
    status: draft.status,
    tags: draft.tagIds.map(Number),
    weight: draft.weight,
  };
}

export function formatTermLabel(
  term: AdminProductTaxonomyTerm,
  terms: AdminProductTaxonomyTerm[],
) {
  const parents: string[] = [];
  let currentParent = term.parent;
  const seen = new Set<number>();

  while (currentParent && !seen.has(currentParent)) {
    seen.add(currentParent);
    const parent = terms.find((candidate) => candidate.id === currentParent);
    if (!parent) break;
    parents.unshift(parent.name);
    currentParent = parent.parent;
  }

  return [...parents, term.name].join(" > ");
}

export function getFrontendProductHref(product: AdminProduct | null) {
  return product ? `${FRONTEND_PRODUCT_PATH}/${product.id}` : "";
}

export function canViewProduct(product: AdminProduct | null) {
  return product?.status === PUBLISHED_PRODUCT_STATUS;
}

export type ShippingField = "weight" | "length" | "width" | "height";

function hasPositiveShippingValue(field: ShippingField, value: string) {
  return field === "weight" ? hasPositiveWeight(value) : hasPositiveDimension(value);
}

export function shouldHighlightShippingField({
  field,
  forceHighlight = false,
  selectedProduct,
  selectedProductId,
  value,
}: {
  field: ShippingField;
  forceHighlight?: boolean;
  selectedProduct: AdminProduct | null;
  selectedProductId: number | "new";
  value: string;
}) {
  if (selectedProductId === "new" || hasPositiveShippingValue(field, value)) {
    return false;
  }

  return forceHighlight || selectedProduct?.status === PUBLISHED_PRODUCT_STATUS;
}

export function shouldHighlightWeightField(params: {
  forceHighlight?: boolean;
  selectedProduct: AdminProduct | null;
  selectedProductId: number | "new";
  weight: string;
}) {
  return shouldHighlightShippingField({
    field: "weight",
    forceHighlight: params.forceHighlight,
    selectedProduct: params.selectedProduct,
    selectedProductId: params.selectedProductId,
    value: params.weight,
  });
}

export function findPromotionTag(tags: AdminProductTaxonomyTerm[]) {
  return tags.find((tag) =>
    PROMOTION_TAG_KEYS.has(normalizeKey(tag.slug || tag.name)),
  );
}

function parsePromotionDate(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isPromotionActive(
  product: AdminProduct,
  promotionTagId?: number,
) {
  const hasPromotionPrice = Boolean(product.salePrice.trim());
  const hasPromotionTag =
    typeof promotionTagId === "number" &&
    product.tags.some((tag) => tag.id === promotionTagId);

  if (!hasPromotionPrice && !hasPromotionTag) {
    return false;
  }

  const now = new Date();
  const startsAt = parsePromotionDate(product.dateOnSaleFrom);
  const endsAt = parsePromotionDate(product.dateOnSaleTo);

  if (startsAt && startsAt > now) {
    return false;
  }

  if (endsAt && endsAt < now) {
    return false;
  }

  return true;
}
