import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { isMockDataEnabled } from "@/lib/server/env";
import {
  getCategoryFilterForTypes,
  getCategoryTypeBySlug,
  getTabCounts,
} from "./get-wp-product-categories";
import { fetchWpProductsSafe, mapWpProductToCatalogItem } from "./wp-catalog";
import { searchCatalogProducts } from "./catalog-search";
import { SPECIFIC_PRODUCT_TYPES } from "../utils/product-type-taxonomy";
import {
  PRODUCT_FALLBACK_IMAGE,
  resolveProductImage,
} from "../utils/resolve-product-image";
import type {
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
        SPECIFIC_PRODUCT_TYPES.includes(item as Exclude<ProductTypeId, "todos">),
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

function normalizePriceRange(input: { minPrice?: number | null; maxPrice?: number | null }) {
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

function inferBadge(product: MockCatalogProduct, type: Exclude<ProductTypeId, "todos">) {
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
    typeof product.subcategory === "string" ? normalizeText(product.subcategory) : "";
  const normalizedSubcategory2 =
    typeof product.subcategory2 === "string"
      ? normalizeText(product.subcategory2)
      : "";
  const normalizedTags = (product.homeData?.tags ?? []).map((tag) =>
    normalizeText(tag),
  );
  const hasTag = (value: string) => normalizedTags.includes(normalizeText(value));

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
  };
}

export async function getProductsCatalog(
  input: GetProductsCatalogInput = {},
): Promise<ProductsCatalogPayload> {
  const useMockData = isMockDataEnabled();
  const selectedTypes = normalizeSelectedTypes(input.selectedTypes, input.type);
  const activeCollection = normalizeCollection(input.collection);
  const activeType = selectedTypes.length === 1 ? selectedTypes[0] : "todos";
  const { minPrice, maxPrice } = normalizePriceRange({
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
  });
  const perPage = clamp(input.perPage ?? 9, 1, 60);
  const search = normalizeProductSearch(input.search);

  const currentPage = clamp(input.page ?? 1, 1, Number.MAX_SAFE_INTEGER);
  const fetchBufferCap = 120;
  const fetchFirst = Math.min(
    fetchBufferCap,
    Math.max(perPage * 3, currentPage * perPage * 2 + 20),
  );

  let fetchedItems: ProductsCatalogItem[];
  let tabs: ProductsCatalogTab[];

  if (useMockData) {
    fetchedItems = (await requestProductsCatalogMockFile()).products.map(
      mapMockProductToCatalogItem,
    );
    tabs = [
      { id: "todos", label: TYPE_LABEL.todos, count: fetchedItems.length },
      ...(["sedas", "piteiras", "filtros", "acessorios"] as const).map((type) => ({
        id: type,
        label: TYPE_LABEL[type],
        count: fetchedItems.filter((item) => item.type === type).length,
      })),
    ];
  } else {
    const [categoryFilter, typeBySlug, tabCounts] = await Promise.all([
      getCategoryFilterForTypes(selectedTypes),
      getCategoryTypeBySlug(),
      getTabCounts(),
    ]);

    tabs = [
      { id: "todos", label: TYPE_LABEL.todos, count: tabCounts.todos },
      ...(["sedas", "piteiras", "filtros", "acessorios"] as const).map((type) => ({
        id: type,
        label: TYPE_LABEL[type],
        count: tabCounts[type],
      })),
    ];

    if (categoryFilter.unresolved.length > 0) {
      console.warn(
        "[products-catalog] Categoria sem termo correspondente no WordPress; nenhum produto será listado.",
        categoryFilter.unresolved.join(", "),
      );

      return buildEmptyPayload({
        tabs,
        selectedTypes,
        activeType,
        activeCollection,
        minPrice,
        maxPrice,
        perPage,
      });
    }

    if (search) {
      const searchResult = await searchCatalogProducts({
        search,
        categorySlugs: selectedTypes.length > 0 ? categoryFilter.slugs : [],
        minPrice,
        maxPrice,
        page: currentPage,
        perPage,
      });
      const wpProducts = await fetchWpProductsSafe(
        { first: Math.max(1, searchResult.ids.length), include: searchResult.ids },
        "products-catalog-search",
      );
      const itemsById = new Map(
        wpProducts.map((product, index) => [
          product.databaseId,
          mapWpProductToCatalogItem(product, index, typeBySlug),
        ]),
      );

      return {
        items: searchResult.ids.flatMap((id) => {
          const item = itemsById.get(id);
          return item ? [item] : [];
        }),
        tabs,
        selectedTypes,
        minPrice,
        maxPrice,
        activeType,
        activeCollection,
        totalItems: searchResult.total,
        totalPages: Math.max(1, Math.ceil(searchResult.total / searchResult.per_page)),
        currentPage: searchResult.page,
        perPage: searchResult.per_page,
        coverageCep: null,
        coverageStatus: "not_requested",
      };
    }

    const wpProducts = await fetchWpProductsSafe(
      {
        first: fetchFirst,
        categoryIn: selectedTypes.length > 0 ? categoryFilter.slugs : undefined,
        minPrice,
        maxPrice,
      },
      "products-catalog",
    );

    fetchedItems = wpProducts.map((product, index) =>
      mapWpProductToCatalogItem(product, index, typeBySlug),
    );
  }

  const typeFilteredItems =
    selectedTypes.length === 0
      ? fetchedItems
      : fetchedItems.filter((item) => selectedTypes.includes(item.type));

  const collectionFilteredItems = typeFilteredItems.filter((item) => {
    if (activeCollection === "premium") {
      return item.isPremium;
    }

    if (activeCollection === "novidades") {
      return item.isNewArrival;
    }

    if (activeCollection === "promocoes") {
      return item.isOnSale;
    }

    if (activeCollection === "kits") {
      return item.isKit;
    }

    return true;
  });

  const filteredItems = collectionFilteredItems.filter((item) => {
    if (minPrice !== null && item.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && item.price > maxPrice) {
      return false;
    }

    return true;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const clampedPage = clamp(currentPage, 1, totalPages);
  const start = (clampedPage - 1) * perPage;
  const end = start + perPage;

  return {
    items: filteredItems.slice(start, end),
    tabs,
    selectedTypes,
    minPrice,
    maxPrice,
    activeType,
    activeCollection,
    totalItems,
    totalPages,
    currentPage: clampedPage,
    perPage,
    coverageCep: null,
    coverageStatus: "not_requested",
  };
}
