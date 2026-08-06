import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { isMockDataEnabled } from "@/lib/server/env";
import {
  getCategoryFilterForTypes,
  getCategoryTypeBySlug,
  getTabCounts,
} from "./get-wp-product-categories";
import {
  fetchAllWpProductsResult,
  fetchWpProductsResult,
  mapWpProductToCatalogItem,
  markNewArrivals,
} from "./wp-catalog";
import { searchCatalogProducts } from "./catalog-search";
import { getHomeFlashSale } from "./get-home-flash-sale";
import { applyFlashSaleToCatalogItem } from "./apply-flash-sale-to-product";
import { SPECIFIC_PRODUCT_TYPES } from "../utils/product-type-taxonomy";
import {
  PRODUCT_FALLBACK_IMAGE,
  resolveProductImage,
} from "../utils/resolve-product-image";
import type {
  CatalogSourceStatus,
  ProductCollectionId,
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogPayload,
  ProductsCatalogTab,
} from "../types/products-catalog";
import { normalizeProductSearch } from "../utils/product-search";

interface MockHomeData {
  displayName?: string;
  imageUrl?: string;
  tags?: string[];
  originalPrice?: number;
  price?: number;
  isNewArrival?: boolean;
  discountPercent?: number;
}

interface MockCatalogProduct {
  id: string;
  name: string;
  imageUrl?: string;
  subcategory?: string | null;
  subcategory2?: string | null;
  price?: {
    amount?: number | null;
  };
  homeData?: MockHomeData;
}

interface ProductsMockFile {
  products: MockCatalogProduct[];
}

export interface GetProductsCatalogInput {
  page?: number;
  type?: ProductTypeId;
  collection?: ProductCollectionId;
  selectedTypes?: Exclude<ProductTypeId, "todos">[];
  minPrice?: number | null;
  maxPrice?: number | null;
  perPage?: number;
  search?: string;
}

const TYPE_LABEL: Record<ProductTypeId, string> = {
  todos: "TODOS",
  sedas: "SEDAS",
  piteiras: "PITEIRAS",
  filtros: "FILTROS",
  acessorios: "ACESSÓRIOS",
};

const CATEGORY_LABEL: Record<Exclude<ProductTypeId, "todos">, string> = {
  sedas: "Seda",
  piteiras: "Piteira",
  filtros: "Filtro",
  acessorios: "Acessório",
};

/**
 * Teto de produtos varridos por listagem, constante de propósito.
 *
 * Constante, e não derivado de `perPage`/`page`: a chave do Data Cache do Next inclui o corpo
 * da requisição, e o corpo carrega `first` — com lote variável cada combinação da UI virava
 * uma chave distinta e `totalItems`/`totalPages` mudavam de uma página para outra.
 *
 * Alto de propósito: `fetchAllWpProductsResult` pagina por cursor em blocos de
 * `WP_GRAPHQL_MAX_FIRST`, então isto é só a rede de segurança contra varredura infinita — não
 * o recorte que a listagem enxerga. Bater neste limite emite warning, nunca corta em silêncio.
 */
const CATALOG_SCAN_LIMIT = 1000;

const BADGE_PRIORITY = [
  "Mais Vendido",
  "Kit",
  "Novo",
  "Orgânico",
  "Especial",
  "Clássico",
  "Premium",
  "Essencial",
] as const;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSelectedTypes(
  selectedTypes: GetProductsCatalogInput["selectedTypes"],
  type: GetProductsCatalogInput["type"],
) {
  if (Array.isArray(selectedTypes) && selectedTypes.length > 0) {
    const normalized = selectedTypes.filter(
      (item): item is Exclude<ProductTypeId, "todos"> =>
        typeof item === "string" &&
        SPECIFIC_PRODUCT_TYPES.includes(
          item as Exclude<ProductTypeId, "todos">,
        ),
    );

    return Array.from(new Set(normalized));
  }

  if (type && type !== "todos") {
    return [type];
  }

  return [];
}

function normalizeCollection(
  value: GetProductsCatalogInput["collection"],
): ProductCollectionId {
  if (
    value === "todos" ||
    value === "premium" ||
    value === "novidades" ||
    value === "promocoes" ||
    value === "kits"
  ) {
    return value;
  }

  return "todos";
}

function normalizePriceValue(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Number(value.toFixed(2));
}

function normalizePriceRange(input: {
  minPrice?: number | null;
  maxPrice?: number | null;
}) {
  const normalizedMin = normalizePriceValue(input.minPrice);
  const normalizedMax = normalizePriceValue(input.maxPrice);

  if (
    normalizedMin !== null &&
    normalizedMax !== null &&
    normalizedMin > normalizedMax
  ) {
    return { minPrice: normalizedMax, maxPrice: normalizedMin };
  }

  return { minPrice: normalizedMin, maxPrice: normalizedMax };
}

function inferTypeFromName(name: string): Exclude<ProductTypeId, "todos"> {
  const normalized = normalizeText(name);

  if (normalized.includes("seda")) {
    return "sedas";
  }
  if (normalized.includes("piteira")) {
    return "piteiras";
  }
  if (normalized.includes("filtro")) {
    return "filtros";
  }

  return "acessorios";
}

function inferBadge(
  product: MockCatalogProduct,
  type: Exclude<ProductTypeId, "todos">,
) {
  const homeTags = product.homeData?.tags ?? [];
  for (const badge of BADGE_PRIORITY) {
    if (homeTags.includes(badge)) {
      return badge;
    }
  }

  const subcategory2 =
    typeof product.subcategory2 === "string" ? product.subcategory2.trim() : "";
  if (subcategory2 && subcategory2 !== "-") {
    return subcategory2;
  }

  const subcategory =
    typeof product.subcategory === "string" ? product.subcategory.trim() : "";
  if (subcategory && subcategory !== "-") {
    return subcategory;
  }

  if (type === "sedas") return "Clássico";
  if (type === "piteiras") return "Essencial";
  if (type === "filtros") return "Filtro";
  return "Acessório";
}

function mapMockProductToCatalogItem(
  product: MockCatalogProduct,
  index: number,
): ProductsCatalogItem {
  const name = product.homeData?.displayName || product.name;
  const type = inferTypeFromName(product.name);
  const fallbackAmount = 0;
  const amount = product.price?.amount;
  const basePrice =
    typeof amount === "number" && Number.isFinite(amount) && amount > 0
      ? amount
      : fallbackAmount;

  const originalPrice =
    typeof product.homeData?.originalPrice === "number" &&
    Number.isFinite(product.homeData.originalPrice)
      ? toMoney(product.homeData.originalPrice)
      : toMoney(basePrice);

  const price =
    typeof product.homeData?.price === "number" &&
    Number.isFinite(product.homeData.price) &&
    product.homeData.price > 0
      ? toMoney(product.homeData.price)
      : originalPrice;

  const normalizedName = normalizeText(product.name);
  const normalizedSubcategory =
    typeof product.subcategory === "string"
      ? normalizeText(product.subcategory)
      : "";
  const normalizedSubcategory2 =
    typeof product.subcategory2 === "string"
      ? normalizeText(product.subcategory2)
      : "";
  const normalizedTags = new Set(
    (product.homeData?.tags ?? []).map((tag) => normalizeText(tag)),
  );
  const hasTag = (value: string) => normalizedTags.has(normalizeText(value));

  const isPremium =
    hasTag("Premium") ||
    normalizedSubcategory.includes("premium") ||
    normalizedSubcategory2.includes("premium") ||
    normalizedName.includes("premium");
  const isNewArrival =
    product.homeData?.isNewArrival === true ||
    hasTag("Recém Chegado") ||
    hasTag("Novo");
  const isOnSale =
    (typeof product.homeData?.discountPercent === "number" &&
      product.homeData.discountPercent > 0) ||
    price < originalPrice;
  const isKit =
    hasTag("Kit") ||
    normalizedSubcategory.includes("kit") ||
    normalizedSubcategory2.includes("kit") ||
    normalizedName.includes("kit");

  return {
    id: product.id,
    category: CATEGORY_LABEL[type],
    name,
    badge: inferBadge(product, type),
    originalPrice,
    price,
    rating: Number((3.9 + (index % 10) * 0.1).toFixed(1)),
    reviews: 48 + ((index * 37) % 760),
    image:
      resolveProductImage({
        productImageUrl: product.imageUrl,
        homeImageUrl: product.homeData?.imageUrl,
      }) ?? PRODUCT_FALLBACK_IMAGE,
    type,
    isPremium,
    isNewArrival,
    isOnSale,
    isKit,
  };
}

async function requestProductsCatalogMockFile() {
  const filePath = path.join(process.cwd(), "mock", "products.json");

  await new Promise((resolve) => setTimeout(resolve, 80));

  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ProductsMockFile;
}

interface EmptyPayloadInput {
  tabs: ProductsCatalogTab[];
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  activeType: ProductTypeId;
  activeCollection: ProductCollectionId;
  minPrice: number | null;
  maxPrice: number | null;
  perPage: number;
  sourceStatus?: CatalogSourceStatus;
}

function buildEmptyPayload(input: EmptyPayloadInput): ProductsCatalogPayload {
  return {
    items: [],
    tabs: input.tabs,
    selectedTypes: input.selectedTypes,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    activeType: input.activeType,
    activeCollection: input.activeCollection,
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    perPage: input.perPage,
    coverageCep: null,
    coverageStatus: "not_requested",
    sourceStatus: input.sourceStatus ?? "ok",
  };
}

interface NormalizedCatalogInput {
  selectedTypes: Exclude<ProductTypeId, "todos">[];
  activeCollection: ProductCollectionId;
  activeType: ProductTypeId;
  minPrice: number | null;
  maxPrice: number | null;
  perPage: number;
  currentPage: number;
  search: string;
}

interface CatalogItemsResult {
  items: ProductsCatalogItem[];
  sourceStatus: CatalogSourceStatus;
}

type FlashSaleCampaign = Awaited<ReturnType<typeof getHomeFlashSale>>;

function normalizeCatalogInput(
  input: GetProductsCatalogInput,
): NormalizedCatalogInput {
  const selectedTypes = normalizeSelectedTypes(input.selectedTypes, input.type);
  const { minPrice, maxPrice } = normalizePriceRange({
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
  });

  return {
    selectedTypes,
    activeCollection: normalizeCollection(input.collection),
    activeType: selectedTypes.length === 1 ? selectedTypes[0] : "todos",
    minPrice,
    maxPrice,
    perPage: clamp(input.perPage ?? 9, 1, 60),
    currentPage: clamp(input.page ?? 1, 1, Number.MAX_SAFE_INTEGER),
    search: normalizeProductSearch(input.search),
  };
}

function buildTabs(
  counts: Record<ProductTypeId, number>,
): ProductsCatalogTab[] {
  return [
    { id: "todos", label: TYPE_LABEL.todos, count: counts.todos },
    ...SPECIFIC_PRODUCT_TYPES.map((type) => ({
      id: type,
      label: TYPE_LABEL[type],
      count: counts[type],
    })),
  ];
}

function buildMockTabs(items: ProductsCatalogItem[]): ProductsCatalogTab[] {
  const counts: Record<ProductTypeId, number> = {
    todos: items.length,
    sedas: 0,
    piteiras: 0,
    filtros: 0,
    acessorios: 0,
  };

  for (const item of items) {
    counts[item.type] += 1;
  }

  return buildTabs(counts);
}

async function loadMockCatalog(): Promise<
  CatalogItemsResult & { tabs: ProductsCatalogTab[] }
> {
  const [mockFile, flashSaleCampaign] = await Promise.all([
    requestProductsCatalogMockFile(),
    getHomeFlashSale(),
  ]);
  const items = mockFile.products
    .map((product, index) => mapMockProductToCatalogItem(product, index))
    .map((item) => applyFlashSaleToCatalogItem(item, flashSaleCampaign));

  return { items, tabs: buildMockTabs(items), sourceStatus: "ok" };
}

function buildSearchPayload(
  input: NormalizedCatalogInput,
  tabs: ProductsCatalogTab[],
  searchResult: Awaited<ReturnType<typeof searchCatalogProducts>>,
  products: ProductsCatalogItem[],
  sourceStatus: CatalogSourceStatus,
): ProductsCatalogPayload {
  const itemsById = new Map(products.map((item) => [item.id, item]));

  return {
    items: searchResult.ids.flatMap((id) => {
      const item = itemsById.get(String(id));
      return item ? [item] : [];
    }),
    tabs,
    selectedTypes: input.selectedTypes,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    activeType: input.activeType,
    activeCollection: input.activeCollection,
    totalItems: searchResult.total,
    totalPages: Math.max(
      1,
      Math.ceil(searchResult.total / searchResult.per_page),
    ),
    currentPage: searchResult.page,
    perPage: searchResult.per_page,
    coverageCep: null,
    coverageStatus: "not_requested",
    sourceStatus,
  };
}

async function loadSearchCatalog(
  input: NormalizedCatalogInput,
  categorySlugs: string[],
  typeBySlug: Awaited<ReturnType<typeof getCategoryTypeBySlug>>,
  tabs: ProductsCatalogTab[],
  flashSaleCampaign: FlashSaleCampaign,
): Promise<ProductsCatalogPayload> {
  const searchResult = await searchCatalogProducts({
    search: input.search,
    categorySlugs: input.selectedTypes.length > 0 ? categorySlugs : [],
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    page: input.currentPage,
    perPage: input.perPage,
  });
  const searchHydration = await fetchWpProductsResult(
    { first: Math.max(1, searchResult.ids.length), include: searchResult.ids },
    "products-catalog-search",
  );
  const products = searchHydration.products.map((product, index) =>
    applyFlashSaleToCatalogItem(
      mapWpProductToCatalogItem(product, index, typeBySlug),
      flashSaleCampaign,
    ),
  );

  return buildSearchPayload(
    input,
    tabs,
    searchResult,
    products,
    searchHydration.ok ? "ok" : "unavailable",
  );
}

function getCampaignProductIds(
  flashSaleCampaign: FlashSaleCampaign,
  minPrice: number | null,
  maxPrice: number | null,
) {
  if ((minPrice === null && maxPrice === null) || !flashSaleCampaign) {
    return [];
  }

  return flashSaleCampaign.products
    .map((product) => Number(product.id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

async function loadWpCatalogItems(
  input: NormalizedCatalogInput,
  categorySlugs: string[],
  typeBySlug: Awaited<ReturnType<typeof getCategoryTypeBySlug>>,
  flashSaleCampaign: FlashSaleCampaign,
): Promise<CatalogItemsResult> {
  const campaignProductIds = getCampaignProductIds(
    flashSaleCampaign,
    input.minPrice,
    input.maxPrice,
  );
  const [catalogResult, campaignResult] = await Promise.all([
    fetchAllWpProductsResult(
      {
        categoryIn: input.selectedTypes.length > 0 ? categorySlugs : undefined,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
      },
      CATALOG_SCAN_LIMIT,
      "products-catalog",
    ),
    campaignProductIds.length > 0
      ? fetchWpProductsResult(
          { first: campaignProductIds.length, include: campaignProductIds },
          "products-catalog-flash-sale",
        )
      : Promise.resolve({ products: [], ok: true, truncated: false }),
  ]);

  if (catalogResult.truncated) {
    console.warn(
      `[products-catalog] Varredura interrompida em ${CATALOG_SCAN_LIMIT} produtos; coleção, tipo e preço foram filtrados sobre catálogo incompleto.`,
    );
  }

  const knownIds = new Set(
    catalogResult.products.map((product) => product.databaseId),
  );
  const mergedProducts = [
    ...catalogResult.products,
    ...campaignResult.products.filter(
      (product) => !knownIds.has(product.databaseId),
    ),
  ];
  const items = markNewArrivals(
    mergedProducts
      .map((product, index) =>
        mapWpProductToCatalogItem(product, index, typeBySlug),
      )
      .map((item) => applyFlashSaleToCatalogItem(item, flashSaleCampaign)),
  );

  return {
    items,
    sourceStatus: catalogResult.ok ? "ok" : "unavailable",
  };
}

async function loadWpCatalog(
  input: NormalizedCatalogInput,
): Promise<ProductsCatalogPayload> {
  const [categoryFilter, typeBySlug, tabCounts, flashSaleCampaign] =
    await Promise.all([
      getCategoryFilterForTypes(input.selectedTypes),
      getCategoryTypeBySlug(),
      getTabCounts(),
      getHomeFlashSale(),
    ]);
  const tabs = buildTabs(tabCounts);

  if (categoryFilter.unresolved.length > 0) {
    console.warn(
      categoryFilter.available
        ? "[products-catalog] Categoria sem termo correspondente no WordPress; nenhum produto será listado."
        : "[products-catalog] Taxonomia indisponível no WPGraphQL; listagem vai para estado de erro.",
      categoryFilter.unresolved.join(", "),
    );

    return buildEmptyPayload({
      tabs,
      selectedTypes: input.selectedTypes,
      activeType: input.activeType,
      activeCollection: input.activeCollection,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice,
      perPage: input.perPage,
      sourceStatus: categoryFilter.available ? "ok" : "unavailable",
    });
  }

  if (input.search) {
    return loadSearchCatalog(
      input,
      categoryFilter.slugs,
      typeBySlug,
      tabs,
      flashSaleCampaign,
    );
  }

  const catalog = await loadWpCatalogItems(
    input,
    categoryFilter.slugs,
    typeBySlug,
    flashSaleCampaign,
  );
  return buildCatalogPayload(input, catalog.items, tabs, catalog.sourceStatus);
}

function matchesCollection(
  item: ProductsCatalogItem,
  collection: ProductCollectionId,
) {
  if (collection === "premium") return item.isPremium;
  if (collection === "novidades") return item.isNewArrival;
  if (collection === "promocoes") return item.isOnSale;
  if (collection === "kits") return item.isKit;
  return true;
}

function filterCatalogItems(
  items: ProductsCatalogItem[],
  input: NormalizedCatalogInput,
) {
  return items.filter((item) => {
    if (
      input.selectedTypes.length > 0 &&
      !input.selectedTypes.includes(item.type)
    ) {
      return false;
    }
    if (!matchesCollection(item, input.activeCollection)) {
      return false;
    }
    if (input.minPrice !== null && item.price < input.minPrice) {
      return false;
    }
    if (input.maxPrice !== null && item.price > input.maxPrice) {
      return false;
    }
    return true;
  });
}

function buildCatalogPayload(
  input: NormalizedCatalogInput,
  items: ProductsCatalogItem[],
  tabs: ProductsCatalogTab[],
  sourceStatus: CatalogSourceStatus,
): ProductsCatalogPayload {
  const filteredItems = filterCatalogItems(items, input);
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / input.perPage));
  const currentPage = clamp(input.currentPage, 1, totalPages);
  const start = (currentPage - 1) * input.perPage;

  return {
    items: filteredItems.slice(start, start + input.perPage),
    tabs,
    selectedTypes: input.selectedTypes,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    activeType: input.activeType,
    activeCollection: input.activeCollection,
    totalItems,
    totalPages,
    currentPage,
    perPage: input.perPage,
    coverageCep: null,
    coverageStatus: "not_requested",
    sourceStatus,
  };
}

export async function getProductsCatalog(
  input: GetProductsCatalogInput = {},
): Promise<ProductsCatalogPayload> {
  const normalizedInput = normalizeCatalogInput(input);

  if (isMockDataEnabled()) {
    const catalog = await loadMockCatalog();
    return buildCatalogPayload(
      normalizedInput,
      catalog.items,
      catalog.tabs,
      catalog.sourceStatus,
    );
  }

  return loadWpCatalog(normalizedInput);
}
