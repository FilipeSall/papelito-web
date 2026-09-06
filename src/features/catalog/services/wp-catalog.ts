import "server-only";

import { print } from "graphql";

import { isMockDataEnabled } from "@/lib/server/env";
import { wpGraphqlRequest } from "@/lib/server/wp-graphql";
import type { HomeProductCard } from "../types/home-products";
import type { ProductDetailItem, ProductDetailRelatedThumb } from "../types/product-detail";
import type { ProductTypeId, ProductsCatalogItem } from "../types/products-catalog";
import { PRODUCTS_LIST_QUERY, PRODUCT_QUERY } from "../queries/products";
import { calculateDiscountPercent } from "../utils/discount-percent";
import {
  PRODUCT_FALLBACK_IMAGE,
  resolveProductImage,
} from "../utils/resolve-product-image";
import { hasPositiveDimension, hasPositiveWeight } from "@/utils/weight";

export interface WpProductNode {
  __typename?: string | null;
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  /** Publicação do produto, com offset. Fonte única de recência de Recém-chegados. */
  date?: string | null;
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
  papelitoCategory?: {
    databaseId?: number | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  papelitoSubcategories?: Array<{
    databaseId?: number | null;
    facet?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null> | null;
  papelitoCollections?: Array<string | null> | null;
  sku?: string | null;
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

/**
 * O tipo vem da categoria principal da taxonomia Papelito.
 */
function inferType(product: WpProductNode): Exclude<ProductTypeId, "todos"> {
  // A categoria Papelito é o dado, não uma heurística: o slug dela É o id da UI.
  // Classificar por substring do nome era proibido e fazia toda categoria
  // desconhecida cair em ACESSÓRIOS.
  const slug = product.papelitoCategory?.slug;

  return typeof slug === "string" && slug.trim().length > 0 ? slug : "";
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
  const discountPercent = calculateDiscountPercent(regularPrice, price);

  return {
    originalPrice: regularPrice,
    price,
    discountPercent,
  };
}

function resolveBadge(product: WpProductNode) {
  const subcategory = (product.papelitoSubcategories ?? []).find(
    (item) => typeof item?.name === "string" && item.name.trim().length > 0,
  );

  return subcategory?.name?.trim() || product.papelitoCategory?.name?.trim() || "Produto";
}

function resolveCategoryLabel(product: WpProductNode) {
  return product.papelitoCategory?.name?.trim() || "Produto";
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
  return (
    typeof product.papelitoCategory?.slug === "string" &&
    product.papelitoCategory.slug.trim().length > 0 &&
    hasValidShippingData(product) &&
    resolvePrices(product).price > 0
  );
}

export interface FetchWpProductsInput {
  first?: number;
  after?: string | null;
  include?: number[];
  minPrice?: number | null;
  maxPrice?: number | null;
}

export interface FetchWpProductsResult {
  products: WpProductNode[];
  ok: boolean;
  truncated: boolean;
}

/**
 * Teto por requisição imposto pelo próprio WPGraphQL.
 *
 * A consulta de listagem também traz as variações para validar as medidas de frete. Em produção,
 * o WPGraphQL devolve uma conexão vazia a partir de 48 itens nessa combinação. Quem precisa de
 * mais tem que paginar por cursor, em vez de pedir um lote acima do teto efetivo.
 */
export const WP_GRAPHQL_MAX_FIRST = 47;

interface RequestWpProductsResult {
  products: WpProductNode[];
  /** Nós devolvidos antes do filtro de visibilidade — é o que a varredura precisa contar. */
  scanned: number;
  hasNextPage: boolean;
  endCursor: string | null;
}

async function requestWpProducts(
  input: FetchWpProductsInput | number,
): Promise<RequestWpProductsResult> {
  if (isMockDataEnabled()) {
    return { products: [], scanned: 0, hasNextPage: false, endCursor: null };
  }

  const normalized: FetchWpProductsInput =
    typeof input === "number" ? { first: input } : input;

  const variables: Record<string, unknown> = {
    first: Math.min(normalized.first ?? 60, WP_GRAPHQL_MAX_FIRST),
  };

  if (normalized.after) {
    variables.after = normalized.after;
  }


  if (normalized.include) {
    if (normalized.include.length === 0) {
      return { products: [], scanned: 0, hasNextPage: false, endCursor: null };
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
      pageInfo?: {
        hasNextPage?: boolean | null;
        endCursor?: string | null;
      } | null;
      nodes?: WpProductNode[];
    };
  }>(print(PRODUCTS_LIST_QUERY), variables, {
    revalidate: 60,
    tags: ["wp:products"],
  });

  const nodes = data.products?.nodes ?? [];

  return {
    products: nodes.filter(isCatalogProductVisible),
    scanned: nodes.length,
    hasNextPage: data.products?.pageInfo?.hasNextPage === true,
    endCursor: data.products?.pageInfo?.endCursor ?? null,
  };
}

export async function fetchWpProducts(input: FetchWpProductsInput | number = {}) {
  const { products } = await requestWpProducts(input);
  return products;
}

/**
 * Consulta produtos distinguindo "não há produtos" de "não consegui consultar".
 *
 * Indisponibilidade da origem não pode ser servida como catálogo vazio: quem consome
 * precisa de `ok: false` para renderizar erro em vez de estado vazio legítimo.
 *
 * Traz uma página só — para varrer o catálogo inteiro use `fetchAllWpProductsResult`.
 */
export async function fetchWpProductsResult(
  input: FetchWpProductsInput | number = {},
  context = "wp-products",
): Promise<FetchWpProductsResult> {
  try {
    const { products, hasNextPage } = await requestWpProducts(input);
    return { products, ok: true, truncated: hasNextPage };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[${context}] Falha ao consultar produtos no WPGraphQL.`, message);
    return { products: [], ok: false, truncated: false };
  }
}

export async function fetchWpProductsSafe(
  input: FetchWpProductsInput | number = {},
  context = "wp-products",
) {
  const { products } = await fetchWpProductsResult(input, context);
  return products;
}

/**
 * Varre o catálogo paginando por cursor até acabar ou bater em `limit`.
 *
 * `first` não serve para isso: o WPGraphQL corta em `WP_GRAPHQL_MAX_FIRST` sem erro, então
 * pedir mais numa tacada devolvia um recorte silencioso — e coleção, tipo e preço, que são
 * filtrados em memória sobre o resultado, ficavam calculados sobre catálogo incompleto.
 *
 * `truncated` só é `true` quando o `limit` interrompeu uma varredura que ainda tinha página.
 */
export async function fetchAllWpProductsResult(
  input: Omit<FetchWpProductsInput, "first" | "after">,
  limit: number,
  context = "wp-products",
): Promise<FetchWpProductsResult> {
  const products: WpProductNode[] = [];
  let after: string | null = null;
  let fetched = 0;

  try {
    while (fetched < limit) {
      const page = await requestWpProducts({
        ...input,
        first: Math.min(WP_GRAPHQL_MAX_FIRST, limit - fetched),
        after,
      });

      products.push(...page.products);
      fetched += page.scanned;

      // `scanned === 0` sem avanço travaria o laço: `fetched` não cresce e o cursor não muda.
      if (!page.hasNextPage || !page.endCursor || page.scanned === 0) {
        return { products, ok: true, truncated: false };
      }

      after = page.endCursor;
    }

    return { products, ok: true, truncated: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[${context}] Falha ao consultar produtos no WPGraphQL.`, message);
    return { products: [], ok: false, truncated: false };
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

/**
 * Coleção curada, vinda do dado persistido.
 *
 * Classificar coleção por substring do nome mantinha `/kits` e `/premium`
 * permanentemente errados: o produto entrava na coleção por acidente de nome.
 */
function hasCollection(product: WpProductNode, collection: string) {
  return (product.papelitoCollections ?? []).some(
    (slug) => typeof slug === "string" && slug === collection,
  );
}

/**
 * Slugs de coleção manual do produto.
 *
 * É a fonte do filtro por coleção no catálogo: o recorte é pertinência do
 * produto, não uma lista de slugs conhecida pelo bundle. Coleção criada no
 * painel passa a filtrar sem deploy.
 */
export function getPapelitoCollectionSlugs(product: WpProductNode) {
  return (product.papelitoCollections ?? []).filter(
    (slug): slug is string => typeof slug === "string" && slug.length > 0,
  );
}

export function getPapelitoSubcategorySlugs(product: WpProductNode) {
  return (product.papelitoSubcategories ?? [])
    .map((node) => node?.slug)
    .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
}

export function mapWpProductToCatalogItem(
  product: WpProductNode,
  index: number,
): ProductsCatalogItem {
  const type = inferType(product);
  const prices = resolvePrices(product);

  return {
    id: String(product.databaseId),
    category: resolveCategoryLabel(product),
    name: product.name,
    badge: resolveBadge(product),
    originalPrice: prices.originalPrice,
    price: prices.price,
    rating: Number((4.1 + (index % 8) * 0.1).toFixed(1)),
    reviews: 32 + ((index * 19) % 480),
    image: resolveImage(product) ?? PRODUCT_FALLBACK_IMAGE,
    type,
    subcategories: getPapelitoSubcategorySlugs(product),
    publishedAt: typeof product.date === "string" ? product.date : null,
    collections: getPapelitoCollectionSlugs(product),
    isPremium: hasCollection(product, "premium"),
    // Quem decide "novidade" é `applyCollectionPools`, sobre a lista já ordenada por data:
    // dentro do mapper só existiria a posição no lote, que varia com perPage e page.
    isNewArrival: false,
    isOnSale: prices.discountPercent > 0,
    isKit: hasCollection(product, "kits"),
  };
}

/**
 * Diz se uma data de publicação cabe na janela de novidade.
 *
 * `expirationDays` igual a zero é "sem prazo" e aceita qualquer data, inclusive ausente. Com prazo
 * configurado, produto sem data fica de fora: não há como provar que ele é recente, e incluí-lo
 * faria a coleção mentir justamente na configuração que o administrador ligou para restringi-la.
 */
export function isWithinNewArrivalWindow(
  publishedAt: string | null | undefined,
  expirationDays: number,
  now = Date.now(),
): boolean {
  if (expirationDays <= 0) {
    return true;
  }

  if (typeof publishedAt !== "string" || publishedAt.length === 0) {
    return false;
  }

  const published = new Date(publishedAt).getTime();

  if (Number.isNaN(published)) {
    return false;
  }

  return now - published <= expirationDays * 24 * 60 * 60 * 1000;
}

/**
 * Aplica os tetos configurados das duas coleções derivadas sobre o catálogo varrido.
 *
 * Depende de a lista chegar ordenada por data decrescente (`orderby` de `PRODUCTS_LIST_QUERY`) e de
 * o lote ser constante — do contrário o conjunto mudaria conforme `perPage` e `page`.
 *
 * Em Promoções o teto é gravado zerando `isOnSale` além do corte. Isso é aceitável porque essa flag
 * é, neste modelo, apenas o predicado de pertinência da coleção (`matchesCollection`) — o desconto
 * que o card exibe vem de `price`/`originalPrice`, não dela.
 */
export function applyCollectionPools(
  items: ProductsCatalogItem[],
  config: { newArrivals: { limit: number; expirationDays: number }; promotions: { limit: number } },
  now = Date.now(),
): ProductsCatalogItem[] {
  const newArrivalIds = new Set<string>();

  if (config.newArrivals.limit > 0) {
    for (const item of items) {
      if (newArrivalIds.size >= config.newArrivals.limit) {
        break;
      }

      if (isWithinNewArrivalWindow(item.publishedAt, config.newArrivals.expirationDays, now)) {
        newArrivalIds.add(item.id);
      }
    }
  }

  const promotionsLimit = config.promotions.limit;
  const promotionIds = new Set<string>();

  if (promotionsLimit > 0) {
    for (const item of items) {
      if (promotionIds.size >= promotionsLimit) {
        break;
      }

      if (item.isOnSale) {
        promotionIds.add(item.id);
      }
    }
  }

  return items.map((item) => ({
    ...item,
    isNewArrival: newArrivalIds.has(item.id),
    isOnSale: promotionsLimit > 0 ? promotionIds.has(item.id) : item.isOnSale,
  }));
}

export function mapWpProductToHomeCard(
  product: WpProductNode,
  index: number,
): HomeProductCard {
  const prices = resolvePrices(product);

  return {
    id: String(product.databaseId),
    category: resolveCategoryLabel(product),
    name: product.name,
    badge: resolveBadge(product),
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
): ProductDetailItem {
  const type = inferType(product);
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
    category: resolveCategoryLabel(product),
    type,
    badge: resolveBadge(product),
    description,
    ...(product.sku?.trim() ? { sku: product.sku.trim() } : {}),
    image: primaryImage,
    rating: 4.4,
    reviews: 678,
    price: prices.price,
    originalPrice: prices.originalPrice,
    discountPercent: prices.discountPercent,
    galleryImages,
    relatedThumbs: relatedProducts
      .filter((item) => item.databaseId !== product.databaseId)
      .filter((item) => inferType(item) === type)
      .slice(0, 4)
      .map(mapWpProductToRelatedThumb),
  };
}
