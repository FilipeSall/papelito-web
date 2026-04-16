import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveProductImage } from "../utils/resolve-product-image";
import type {
  ProductTypeId,
  ProductsCatalogItem,
  ProductsCatalogPayload,
  ProductsCatalogTab,
} from "../types/products-catalog";

interface MockHomeData {
  displayName?: string;
  imageUrl?: string;
  tags?: string[];
  originalPrice?: number;
  price?: number;
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
  selectedTypes?: Exclude<ProductTypeId, "todos">[];
  minPrice?: number | null;
  maxPrice?: number | null;
  perPage?: number;
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
    const allowed: Exclude<ProductTypeId, "todos">[] = [
      "sedas",
      "piteiras",
      "filtros",
      "acessorios",
    ];

    const normalized = selectedTypes.filter(
      (item): item is Exclude<ProductTypeId, "todos"> =>
        typeof item === "string" && allowed.includes(item as Exclude<ProductTypeId, "todos">),
    );

    return Array.from(new Set(normalized));
  }

  if (type && type !== "todos") {
    return [type];
  }

  return [];
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

  if (normalizedMin !== null && normalizedMax !== null && normalizedMin > normalizedMax) {
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
  // Usa o nome original do catálogo para inferir tipo com maior precisão
  // (ex.: "Seda Brown King Size" mesmo quando o displayName é "Brown King Size").
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

  return {
    id: product.id,
    category: CATEGORY_LABEL[type],
    name,
    badge: inferBadge(product, type),
    originalPrice,
    price,
    rating: Number((3.9 + (index % 10) * 0.1).toFixed(1)),
    reviews: 48 + ((index * 37) % 760),
    image: resolveProductImage({
      productImageUrl: product.imageUrl,
      homeImageUrl: product.homeData?.imageUrl,
    }),
    type,
  };
}

async function requestProductsCatalogMockFile() {
  // TODO: Substituir por requisição real de catálogo:
  // GET /api/products?page=1&perPage=9&type=sedas
  const filePath = path.join(process.cwd(), "mock", "products.json");

  // Simula latência de rede da chamada ao backend.
  await new Promise((resolve) => setTimeout(resolve, 80));

  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ProductsMockFile;
}

export async function getProductsCatalog(
  input: GetProductsCatalogInput = {},
): Promise<ProductsCatalogPayload> {
  const selectedTypes = normalizeSelectedTypes(input.selectedTypes, input.type);
  const activeType = selectedTypes.length === 1 ? selectedTypes[0] : "todos";
  const { minPrice, maxPrice } = normalizePriceRange({
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
  });
  const perPage = clamp(input.perPage ?? 9, 1, 60);

  const mockFile = await requestProductsCatalogMockFile();
  const allItems = mockFile.products.map(mapMockProductToCatalogItem);

  const tabs: ProductsCatalogTab[] = [
    { id: "todos", label: TYPE_LABEL.todos, count: allItems.length },
    ...(["sedas", "piteiras", "filtros", "acessorios"] as const).map((type) => ({
      id: type,
      label: TYPE_LABEL[type],
      count: allItems.filter((item) => item.type === type).length,
    })),
  ];

  const typeFilteredItems =
    selectedTypes.length === 0
      ? allItems
      : allItems.filter((item) => selectedTypes.includes(item.type));

  const filteredItems = typeFilteredItems.filter((item) => {
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
  const currentPage = clamp(input.page ?? 1, 1, totalPages);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  return {
    items: filteredItems.slice(start, end),
    tabs,
    selectedTypes,
    minPrice,
    maxPrice,
    activeType,
    totalItems,
    totalPages,
    currentPage,
    perPage,
  };
}
