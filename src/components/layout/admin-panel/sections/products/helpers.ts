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

export function hasValidProductPrice(value: string | null | undefined) {
  if (!value?.trim()) {
    return false;
  }

  const normalized = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");

  if (!/^(?:\d+|\d{1,3}(?:[.,]\d{3})+)(?:[.,]\d{1,2})?$/.test(normalized)) {
    return false;
  }

  return parseMoney(normalized) > 0;
}

export function normalizeProductPrice(value: string) {
  return value.trim() ? parseMoney(value).toFixed(2) : "";
}

export function shouldHighlightPriceField(value: string | null | undefined) {
  return !hasValidProductPrice(value);
}

export function normalizeShippingMeasure(value: string | null | undefined) {
  const normalized = value?.trim().replace(",", ".") ?? "";
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
}

export function productToDraft(product: AdminProduct): ProductDraft {
  return {
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
    taxonomyCategoryId: "",
    taxonomyCollections: [],
    taxonomySubcategoryIds: [],
    weight: product.weight,
    width: product.dimensions.width,
  };
}

/**
 * Aplica a taxonomia Papelito, carregada à parte, sobre um rascunho.
 *
 * A listagem vem da REST do WooCommerce e não conhece a taxonomia própria, então
 * ela é buscada quando o editor abre. Enquanto não chega, os campos ficam vazios
 * — e salvar sem categoria é bloqueado, não silenciosamente aceito.
 */
export function applyTaxonomyToDraft(
  draft: ProductDraft,
  taxonomy: {
    category: { id: number } | null;
    collections: string[];
    subcategories: { id: number }[];
  } | null,
): ProductDraft {
  if (!taxonomy) {
    return draft;
  }

  return {
    ...draft,
    taxonomyCategoryId: taxonomy.category ? String(taxonomy.category.id) : "",
    taxonomyCollections: [...taxonomy.collections],
    taxonomySubcategoryIds: taxonomy.subcategories.map((item) => String(item.id)),
  };
}

export function newProductDraft(): ProductDraft {
  return {
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
    taxonomyCategoryId: "",
    taxonomyCollections: [],
    taxonomySubcategoryIds: [],
    weight: "",
    width: "",
  };
}

export function buildPayload(
  draft: ProductDraft,
  changedFields?: ReadonlySet<keyof ProductDraft>,
) {
  const hasChanged = (field: keyof ProductDraft) =>
    !changedFields || changedFields.has(field);
  const payload: Record<string, unknown> = {};

  if (hasChanged("dateOnSaleFrom")) payload.dateOnSaleFrom = draft.dateOnSaleFrom || null;
  if (hasChanged("dateOnSaleTo")) payload.dateOnSaleTo = draft.dateOnSaleTo || null;
  if (hasChanged("description")) payload.description = draft.description;
  if (hasChanged("height") || hasChanged("length") || hasChanged("width")) {
    payload.dimensions = {
      height: normalizeShippingMeasure(draft.height),
      length: normalizeShippingMeasure(draft.length),
      width: normalizeShippingMeasure(draft.width),
    };
  }
  if (hasChanged("imageIds")) payload.images = draft.imageIds.map(Number);
  if (hasChanged("name")) payload.name = draft.name;
  if (hasChanged("regularPrice")) payload.regularPrice = normalizeProductPrice(draft.regularPrice);
  if (hasChanged("salePrice")) payload.salePrice = normalizeProductPrice(draft.salePrice);
  if (hasChanged("shortDescription")) payload.shortDescription = draft.shortDescription;
  if (hasChanged("slug")) payload.slug = draft.slug;
  if (hasChanged("status")) payload.status = draft.status;
  if (hasChanged("tagIds")) payload.tags = draft.tagIds.map(Number);
  if (hasChanged("weight")) payload.weight = normalizeShippingMeasure(draft.weight);

  return payload;
}

/**
 * Payload da taxonomia Papelito, enviado em requisição própria.
 *
 * Separado de `buildPayload` porque tem outro destino: o produto vai para a REST
 * do WooCommerce, a classificação vai para `papelito/v1/admin/products/{id}/taxonomy`.
 */
export function buildTaxonomyPayload(draft: ProductDraft) {
  return {
    categoryId: Number(draft.taxonomyCategoryId),
    collections: [...draft.taxonomyCollections],
    subcategoryIds: draft.taxonomySubcategoryIds.map(Number).filter(Number.isInteger),
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
