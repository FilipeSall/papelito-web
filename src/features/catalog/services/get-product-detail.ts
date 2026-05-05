import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { isMockDataEnabled } from "@/lib/server/env";
import {
  fetchWpProductByDatabaseId,
  fetchWpProducts,
  mapWpProductToDetailItem,
} from "./wp-catalog";
import { inferProductTypeFromName } from "../utils/infer-product-type-from-name";
import { resolveProductImage } from "../utils/resolve-product-image";
import type { ProductDetailItem } from "../types/product-detail";

interface MockHomeData {
  type?: string;
  displayName?: string;
  imageUrl?: string;
  tags?: string[];
  originalPrice?: number;
  price?: number;
  discountPercent?: number;
}

interface MockCatalogProduct {
  id: string;
  name: string;
  category?: string;
  subcategory?: string | null;
  subcategory2?: string | null;
  description?: string;
  imageUrl?: string;
  price?: {
    amount?: number | null;
  };
  homeData?: MockHomeData;
}

interface ProductsMockFile {
  products: MockCatalogProduct[];
}

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

function toMoney(value: number) {
  return Number(value.toFixed(2));
}

function inferBadge(product: MockCatalogProduct, type: ProductDetailItem["type"]) {
  const tags = product.homeData?.tags ?? [];
  for (const badge of BADGE_PRIORITY) {
    if (tags.includes(badge)) {
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

function computePrices(product: MockCatalogProduct) {
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

  const explicitDiscount =
    typeof product.homeData?.discountPercent === "number" &&
    Number.isFinite(product.homeData.discountPercent)
      ? Math.max(0, Math.round(product.homeData.discountPercent))
      : null;

  const calculatedDiscount =
    originalPrice > 0 && price < originalPrice
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return {
    originalPrice,
    price,
    discountPercent: explicitDiscount ?? calculatedDiscount,
  };
}

function buildRelatedThumbs(
  currentId: string,
  type: ProductDetailItem["type"],
  all: MockCatalogProduct[],
) {
  return all
    .filter((item) => item.id !== currentId)
    .filter((item) => inferProductTypeFromName(item.name) === type)
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      name: item.homeData?.displayName || item.name,
      image: resolveProductImage({
        homeImageUrl: item.homeData?.imageUrl,
        productImageUrl: item.imageUrl,
      }),
      price: computePrices(item).price,
    }));
}

async function requestProductsMockFile() {
  const filePath = path.join(process.cwd(), "mock", "products.json");

  await new Promise((resolve) => setTimeout(resolve, 50));

  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ProductsMockFile;
}

export async function getProductDetail(id: string): Promise<ProductDetailItem | null> {
  if (!isMockDataEnabled()) {
    const [product, allProducts] = await Promise.all([
      fetchWpProductByDatabaseId(id),
      fetchWpProducts(64),
    ]);

    if (!product) {
      return null;
    }

    return mapWpProductToDetailItem(product, allProducts);
  }

  const mockFile = await requestProductsMockFile();
  const product = mockFile.products.find((item) => item.id === id);

  if (!product) {
    return null;
  }

  const name = product.homeData?.displayName || product.name;
  const type = inferProductTypeFromName(product.name);
  const prices = computePrices(product);
  const description =
    typeof product.description === "string" && product.description.trim().length > 0
      ? product.description.split("\n\n")[0]
      : `${name} com qualidade premium para o seu dia a dia.`;

  return {
    id: product.id,
    name,
    category: product.homeData?.type || product.category || "Piteira",
    type,
    badge: inferBadge(product, type),
    description,
    image: resolveProductImage({
      homeImageUrl: product.homeData?.imageUrl,
      productImageUrl: product.imageUrl,
    }),
    rating: 4.4,
    reviews: 678,
    price: prices.price,
    originalPrice: prices.originalPrice,
    discountPercent: prices.discountPercent,
    galleryImages: [
      {
        id: `${product.id}:primary`,
        name,
        image: resolveProductImage({
          homeImageUrl: product.homeData?.imageUrl,
          productImageUrl: product.imageUrl,
        }),
      },
    ],
    relatedThumbs: buildRelatedThumbs(product.id, type, mockFile.products),
  };
}
