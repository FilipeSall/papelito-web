import "server-only";

import { print } from "graphql";

import { isMockDataEnabled } from "@/lib/server/env";
import { wpGraphqlRequest } from "@/lib/server/wp-graphql";
import type { HomeProductCard } from "../types/home-products";
import type { ProductDetailItem, ProductDetailRelatedThumb } from "../types/product-detail";
import type { ProductTypeId, ProductsCatalogItem } from "../types/products-catalog";
import { PRODUCTS_QUERY, PRODUCT_QUERY } from "../queries/products";
import { inferProductTypeFromName } from "../utils/infer-product-type-from-name";
import { resolveProductImage } from "../utils/resolve-product-image";

interface WpProductCategoryNode {
  id?: string | null;
  databaseId?: number | null;
  name?: string | null;
  slug?: string | null;
}

interface WpProductNode {
  __typename?: string | null;
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: {
    sourceUrl?: string | null;
    altText?: string | null;
  } | null;
  productCategories?: {
    nodes?: Array<WpProductCategoryNode | null> | null;
  } | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
}

const CATEGORY_LABEL: Record<Exclude<ProductTypeId, "todos">, string> = {
  sedas: "Seda",
  piteiras: "Piteira",
  filtros: "Filtro",
  acessorios: "Acessório",
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function parseMoney(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/[^\d,.-]/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return toMoney(parsed);
}

function stripHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCategories(product: WpProductNode) {
  return (product.productCategories?.nodes ?? [])
    .filter((category): category is WpProductCategoryNode => Boolean(category))
    .map((category) => ({
      name: category.name?.trim() ?? "",
      slug: category.slug?.trim() ?? "",
    }))
    .filter((category) => category.name || category.slug);
}

function inferType(product: WpProductNode): Exclude<ProductTypeId, "todos"> {
  const categoryText = getCategories(product)
    .map((category) => `${category.name} ${category.slug}`)
    .join(" ");

  return inferProductTypeFromName(`${product.name} ${categoryText}`.trim());
}

function resolvePrices(product: WpProductNode) {
  const regularPrice =
    parseMoney(product.regularPrice) ??
    parseMoney(product.price) ??
    parseMoney(product.salePrice) ??
    0;
  const price =
    parseMoney(product.salePrice) ??
    parseMoney(product.price) ??
    parseMoney(product.regularPrice) ??
    regularPrice;
  const discountPercent =
    regularPrice > 0 && price < regularPrice
      ? Math.round(((regularPrice - price) / regularPrice) * 100)
      : 0;

  return {
    originalPrice: regularPrice,
    price,
    discountPercent,
  };
}

function resolveBadge(product: WpProductNode, type: Exclude<ProductTypeId, "todos">) {
  const [firstCategory] = getCategories(product);

  if (firstCategory?.name) {
    return firstCategory.name;
  }

  return CATEGORY_LABEL[type];
}

function resolveCategoryLabel(product: WpProductNode, type: Exclude<ProductTypeId, "todos">) {
  const [firstCategory] = getCategories(product);
  return firstCategory?.name || CATEGORY_LABEL[type];
}

function resolveImage(product: WpProductNode) {
  return resolveProductImage({
    productImageUrl: product.image?.sourceUrl ?? undefined,
  });
}

export async function fetchWpProducts(first = 100) {
  if (isMockDataEnabled()) {
    return [] as WpProductNode[];
  }

  const data = await wpGraphqlRequest<{
    products?: {
      nodes?: WpProductNode[];
    };
  }>(print(PRODUCTS_QUERY), { first });

  return data.products?.nodes ?? [];
}

export async function fetchWpProductByDatabaseId(id: string) {
  if (isMockDataEnabled()) {
    return null;
  }

  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  const data = await wpGraphqlRequest<{
    product?: WpProductNode | null;
  }>(print(PRODUCT_QUERY), { id: parsedId });

  return data.product ?? null;
}

export function mapWpProductToCatalogItem(
  product: WpProductNode,
  index: number,
): ProductsCatalogItem {
  const type = inferType(product);
  const prices = resolvePrices(product);

  return {
    id: String(product.databaseId),
    category: resolveCategoryLabel(product, type),
    name: product.name,
    badge: resolveBadge(product, type),
    originalPrice: prices.originalPrice,
    price: prices.price,
    rating: Number((4.1 + (index % 8) * 0.1).toFixed(1)),
    reviews: 32 + ((index * 19) % 480),
    image: resolveImage(product),
    type,
    isPremium: normalizeText(product.name).includes("premium"),
    isNewArrival: index < 8,
    isOnSale: prices.discountPercent > 0,
    isKit: normalizeText(product.name).includes("kit"),
  };
}

export function mapWpProductToHomeCard(
  product: WpProductNode,
  index: number,
): HomeProductCard {
  const type = inferType(product);
  const prices = resolvePrices(product);

  return {
    id: String(product.databaseId),
    category: resolveCategoryLabel(product, type),
    name: product.name,
    badge: resolveBadge(product, type),
    discount: prices.discountPercent,
    originalPrice: prices.originalPrice,
    price: prices.price,
    rating: Number((4.2 + (index % 6) * 0.1).toFixed(1)),
    reviews: 80 + index * 17,
    image: resolveImage(product) ?? "/images/products/product-placeholder.png",
  };
}

function mapWpProductToRelatedThumb(
  product: WpProductNode,
): ProductDetailRelatedThumb {
  const prices = resolvePrices(product);

  return {
    id: String(product.databaseId),
    name: product.name,
    image: resolveImage(product),
    price: prices.price,
  };
}

export function mapWpProductToDetailItem(
  product: WpProductNode,
  relatedProducts: WpProductNode[],
): ProductDetailItem {
  const type = inferType(product);
  const prices = resolvePrices(product);
  const description =
    stripHtml(product.shortDescription) ||
    stripHtml(product.description) ||
    `${product.name} com qualidade premium para o seu dia a dia.`;

  return {
    id: String(product.databaseId),
    name: product.name,
    category: resolveCategoryLabel(product, type),
    type,
    badge: resolveBadge(product, type),
    description,
    image: resolveImage(product),
    rating: 4.4,
    reviews: 678,
    price: prices.price,
    originalPrice: prices.originalPrice,
    discountPercent: prices.discountPercent,
    relatedThumbs: relatedProducts
      .filter((item) => item.databaseId !== product.databaseId)
      .filter((item) => inferType(item) === type)
      .slice(0, 4)
      .map(mapWpProductToRelatedThumb),
  };
}
