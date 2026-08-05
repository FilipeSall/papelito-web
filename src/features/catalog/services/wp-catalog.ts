import "server-only";

import { print } from "graphql";

import { isMockDataEnabled } from "@/lib/server/env";
import { wpGraphqlRequest } from "@/lib/server/wp-graphql";
import type { HomeProductCard } from "../types/home-products";
import type { ProductDetailItem, ProductDetailRelatedThumb } from "../types/product-detail";
import type { ProductTypeId, ProductsCatalogItem } from "../types/products-catalog";
import { PRODUCTS_LIST_QUERY, PRODUCT_QUERY } from "../queries/products";
import { inferProductTypeFromName } from "../utils/infer-product-type-from-name";
import {
  normalizeTaxonomyText,
  type SpecificProductTypeId,
} from "../utils/product-type-taxonomy";
import {
  PRODUCT_FALLBACK_IMAGE,
  resolveProductImage,
} from "../utils/resolve-product-image";
import { hasPositiveDimension, hasPositiveWeight } from "@/utils/weight";

interface WpProductCategoryNode {
  id?: string | null;
  databaseId?: number | null;
  name?: string | null;
  slug?: string | null;
}

export interface WpProductNode {
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
  galleryImages?: {
    nodes?: Array<{
      sourceUrl?: string | null;
      altText?: string | null;
    } | null> | null;
  } | null;
  productCategories?: {
    nodes?: Array<WpProductCategoryNode | null> | null;
  } | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  weight?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
  variations?: {
    nodes?: Array<{
      weight?: string | null;
      length?: string | null;
      width?: string | null;
      height?: string | null;
    } | null> | null;
  } | null;
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
      normalized = normalized.replaceAll(".", "").replace(",", ".");
    } else {
      normalized = normalized.replaceAll(",", "");
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

function stripHtmlTags(value: string) {
  let result = "";
  let cursor = 0;

  while (cursor < value.length) {
    const tagStart = value.indexOf("<", cursor);

    if (tagStart === -1) {
      return result + value.slice(cursor);
    }

    const tagEnd = value.indexOf(">", tagStart + 1);

    if (tagEnd === -1) {
      return result + value.slice(cursor);
    }

    if (tagEnd === tagStart + 1) {
      result += value.slice(cursor, tagStart + 1);
      cursor = tagStart + 1;
      continue;
    }

    result += value.slice(cursor, tagStart) + " ";
    cursor = tagEnd + 1;
  }

  return result;
}

function trimHtmlLineBoundaries(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}

function stripHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const withLineBreaks = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|ul|ol|section)\s*>/gi, "\n\n");

  return trimHtmlLineBoundaries(
    stripHtmlTags(withLineBreaks)
    .replace(/&(#x?[0-9a-f]+|\w+);/gi, decodeHtmlEntity)
    // Colapsa apenas espaco horizontal: um \s+ global apagaria as quebras de
    // paragrafo criadas acima e emendaria as frases do cadastro num bloco unico.
    .replace(/[^\S\n]+/g, " ")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeHtmlEntity(_match: string, entity: string) {
  const normalizedEntity = entity.toLowerCase();

  if (normalizedEntity.startsWith("#x")) {
    const codePoint = Number.parseInt(normalizedEntity.slice(2), 16);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : _match;
  }

  if (normalizedEntity.startsWith("#")) {
    const codePoint = Number.parseInt(normalizedEntity.slice(1), 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : _match;
  }

  const namedEntities: Record<string, string> = {
    amp: "&",
    após: "'",
    gt: ">",
    hellip: "...",
    ldquo: "\"",
    lsquo: "'",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: "\"",
    rdquo: "\"",
    rsquo: "'",
    lt: "<",
  };

  return namedEntities[normalizedEntity] ?? _match;
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

export type ProductTypeBySlug = ReadonlyMap<string, SpecificProductTypeId>;

/**
 * A taxonomia manda: o tipo vem da categoria raiz do `product_cat` do produto.
 * O nome só entra quando nenhuma das categorias do produto está mapeada.
 */
function inferType(
  product: WpProductNode,
  typeBySlug?: ProductTypeBySlug,
): Exclude<ProductTypeId, "todos"> {
  const categories = getCategories(product);

  if (typeBySlug) {
    for (const category of categories) {
      const fromTaxonomy =
        typeBySlug.get(normalizeTaxonomyText(category.slug)) ??
        typeBySlug.get(normalizeTaxonomyText(category.name));

      if (fromTaxonomy) {
        return fromTaxonomy;
      }
    }
  }

  const categoryText = categories
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

interface ShippingMeasures {
  weight?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
}

function hasCompleteShippingMeasures(measures: ShippingMeasures | null | undefined) {
  return (
    hasPositiveWeight(measures?.weight) &&
    hasPositiveDimension(measures?.length) &&
    hasPositiveDimension(measures?.width) &&
    hasPositiveDimension(measures?.height)
  );
}

function hasValidShippingData(product: WpProductNode) {
  if (hasCompleteShippingMeasures(product)) {
    return true;
  }

  return (product.variations?.nodes ?? []).some((variation) =>
    hasCompleteShippingMeasures(variation),
  );
}

export function isCatalogProductVisible(product: WpProductNode) {
  return hasValidShippingData(product) && resolvePrices(product).price > 0;
}

export interface FetchWpProductsInput {
  first?: number;
  after?: string | null;
  categoryIn?: string[];
  include?: number[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

export async function fetchWpProducts(input: FetchWpProductsInput | number = {}) {
  if (isMockDataEnabled()) {
    return [] as WpProductNode[];
  }

  const normalized: FetchWpProductsInput =
    typeof input === "number" ? { first: input } : input;

  const variables: Record<string, unknown> = {
    first: normalized.first ?? 60,
  };

  if (normalized.after) {
    variables.after = normalized.after;
  }

  // `categoryIn` presente e vazio significa "nenhuma categoria corresponde", nunca
  // "sem filtro": omitir a cláusula devolveria o catálogo inteiro sob a categoria errada.
  if (normalized.categoryIn) {
    if (normalized.categoryIn.length === 0) {
      return [] as WpProductNode[];
    }

    variables.categoryIn = normalized.categoryIn;
  }

  if (normalized.include) {
    if (normalized.include.length === 0) {
      return [] as WpProductNode[];
    }

    variables.include = normalized.include;
  }

  if (typeof normalized.minPrice === "number" && Number.isFinite(normalized.minPrice)) {
    variables.minPrice = normalized.minPrice;
  }

  if (typeof normalized.maxPrice === "number" && Number.isFinite(normalized.maxPrice)) {
    variables.maxPrice = normalized.maxPrice;
  }

  const data = await wpGraphqlRequest<{
    products?: {
      nodes?: WpProductNode[];
    };
  }>(print(PRODUCTS_LIST_QUERY), variables, {
    revalidate: 60,
    tags: ["wp:products"],
  });

  return (data.products?.nodes ?? []).filter(isCatalogProductVisible);
}

export async function fetchWpProductsSafe(
  input: FetchWpProductsInput | number = {},
  context = "wp-products",
) {
  try {
    return await fetchWpProducts(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[${context}] Falha ao consultar produtos no WPGraphQL.`, message);
    return [] as WpProductNode[];
  }
}

export async function fetchWpProductByDatabaseId(id: string) {
  if (isMockDataEnabled()) {
    return null;
  }

  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  let data: {
    product?: WpProductNode | null;
  };

  try {
    data = await wpGraphqlRequest<{
      product?: WpProductNode | null;
    }>(print(PRODUCT_QUERY), { id: parsedId }, {
      revalidate: 300,
      tags: ["wp:products", `wp:product:${parsedId}`],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes(`No product exists with the database_id: ${parsedId}`)) {
      return null;
    }
    throw error;
  }

  const product = data.product ?? null;

  if (!product || !isCatalogProductVisible(product)) {
    return null;
  }

  return product;
}

export function mapWpProductToCatalogItem(
  product: WpProductNode,
  index: number,
  typeBySlug?: ProductTypeBySlug,
): ProductsCatalogItem {
  const type = inferType(product, typeBySlug);
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
    image: resolveImage(product) ?? PRODUCT_FALLBACK_IMAGE,
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
    image: resolveImage(product) ?? PRODUCT_FALLBACK_IMAGE,
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

function buildProductGallery(product: WpProductNode) {
  const galleryCandidates = [
    {
      id: `${product.databaseId}:primary`,
      name: product.name,
      image: resolveImage(product),
    },
    ...(product.galleryImages?.nodes ?? []).map((node, index) => ({
      id: `${product.databaseId}:gallery:${index}`,
      name: node?.altText?.trim() || product.name,
      image: resolveProductImage({
        productImageUrl: node?.sourceUrl ?? undefined,
      }),
    })),
  ];
  const seen = new Set<string>();

  return galleryCandidates.filter((item) => {
    if (!item.image?.trim()) {
      return false;
    }

    const key = item.image?.trim() || item.id;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function mapWpProductToDetailItem(
  product: WpProductNode,
  relatedProducts: WpProductNode[],
  typeBySlug?: ProductTypeBySlug,
): ProductDetailItem {
  const type = inferType(product, typeBySlug);
  const prices = resolvePrices(product);
  const galleryImages = buildProductGallery(product);
  const primaryImage = resolveImage(product) ?? galleryImages[0]?.image;
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
    image: primaryImage,
    rating: 4.4,
    reviews: 678,
    price: prices.price,
    originalPrice: prices.originalPrice,
    discountPercent: prices.discountPercent,
    galleryImages,
    relatedThumbs: relatedProducts
      .filter((item) => item.databaseId !== product.databaseId)
      .filter((item) => inferType(item, typeBySlug) === type)
      .slice(0, 4)
      .map(mapWpProductToRelatedThumb),
  };
}
