import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { isMockDataEnabled } from "@/lib/server/env";
import { fetchWpProducts, mapWpProductToHomeCard } from "./wp-catalog";
import { getHomeFlashSale } from "./get-home-flash-sale";
import { resolveProductImage } from "../utils/resolve-product-image";
import type {
  HomeFlashSaleCampaign,
  HomeNewArrivalProduct,
  HomeProductCard,
  HomeProductsPayload,
} from "../types/home-products";

interface MockHomeData {
  displayName?: string;
  imageUrl?: string;
  type?: string;
  tags?: string[];
  originalPrice?: number;
  price?: number;
  isNewArrival?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isMostSold?: boolean;
  discountPercent?: number;
}

interface MockCatalogProduct {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  price?: {
    amount?: number | null;
  };
  homeData?: MockHomeData;
}

interface ProductsMockFile {
  products: MockCatalogProduct[];
}

interface HomeCandidate {
  card: HomeProductCard;
  flags: {
    isNewArrival: boolean;
    isBestSeller: boolean;
    isMostSold: boolean;
  };
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

function toDiscountPercent(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(95, Math.round(value)));
}

function toBadge(tags: string[]) {
  for (const badge of BADGE_PRIORITY) {
    if (tags.includes(badge)) {
      return badge;
    }
  }

  return tags[0] ?? "Destaque";
}

function toHomeCandidate(
  product: MockCatalogProduct | null | undefined,
  index: number,
): HomeCandidate | null {
  if (!product) {
    return null;
  }

  try {
    const homeData = product.homeData;
    if (!homeData) {
      return null;
    }

    const resolvedImage = resolveProductImage({
      productImageUrl: product.imageUrl,
      homeImageUrl: homeData.imageUrl,
    });

    if (!resolvedImage) {
      return null;
    }

    const amount = product.price?.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    const rawTags = homeData.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags.filter((tag) => typeof tag === "string" && tag.length > 0)
      : [];

    const originalPriceRaw =
      typeof homeData.originalPrice === "number" &&
      Number.isFinite(homeData.originalPrice)
        ? homeData.originalPrice
        : amount;
    const originalPrice = toMoney(originalPriceRaw);

    const explicitPrice =
      typeof homeData.price === "number" &&
      Number.isFinite(homeData.price) &&
      homeData.price > 0
        ? toMoney(homeData.price)
        : null;

    let discount = toDiscountPercent(homeData.discountPercent);
    const price =
      explicitPrice ??
      (discount > 0 ? toMoney(originalPrice * (1 - discount / 100)) : originalPrice);

    if (discount === 0 && originalPrice > 0 && price < originalPrice) {
      discount = toDiscountPercent(
        ((originalPrice - price) / originalPrice) * 100,
      );
    }

    return {
      card: {
        id: product.id,
        category: homeData.type || product.category,
        name: homeData.displayName || product.name,
        badge: toBadge(tags),
        discount,
        originalPrice,
        price,
        rating: 4.5,
        reviews: 120 + index * 31,
        image: resolvedImage,
      },
      flags: {
        isNewArrival: homeData.isNewArrival === true,
        isBestSeller: homeData.isBestSeller === true,
        isMostSold: homeData.isMostSold === true,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[home-products] Item inválido ignorado ao montar HomeCandidate.", {
      index,
      productId: product.id,
      error: errorMessage,
    });
    return null;
  }
}

async function requestProductsMockFile() {
  const filePath = path.join(process.cwd(), "mock", "products.json");

  await new Promise((resolve) => setTimeout(resolve, 60));

  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as ProductsMockFile;
}

export async function getHomeProducts(): Promise<HomeProductsPayload> {
  if (!isMockDataEnabled()) {
    const [flashSaleCampaign, products] = await Promise.all([
      getHomeFlashSale(),
      fetchWpProducts(48),
    ]);
    const cards = products.map(mapWpProductToHomeCard);
    const bestSellerProducts = cards.slice(0, 8);
    const newArrivalProducts: HomeNewArrivalProduct[] = cards.slice(0, 8).map((card) => ({
      id: card.id,
      name: card.name,
      originalPrice: card.originalPrice,
      price: card.price,
      discount: card.discount,
      image: card.image,
    }));

    return {
      flashSaleCampaign,
      bestSellerProducts,
      newArrivalProducts,
    };
  }

  const [flashSaleCampaign, mockFile] = await Promise.all([
    getHomeFlashSale(),
    requestProductsMockFile(),
  ]);
  const products = Array.isArray(mockFile?.products) ? mockFile.products : [];

  const candidates = products
    .map(toHomeCandidate)
    .filter((item): item is HomeCandidate => item !== null);

  const bestSellerProducts = candidates
    .filter((item) => item.flags.isBestSeller)
    .map((item) => item.card);

  const newArrivalProducts: HomeNewArrivalProduct[] = candidates
    .filter((item) => item.flags.isNewArrival)
    .map(({ card }) => ({
      id: card.id,
      name: card.name,
      originalPrice: card.originalPrice,
      price: card.price,
      discount: card.discount,
      image: card.image,
    }));

  return {
    flashSaleCampaign: mergeMockFlashSale(flashSaleCampaign, candidates),
    bestSellerProducts,
    newArrivalProducts,
  };
}

function mergeMockFlashSale(
  flashSaleCampaign: HomeFlashSaleCampaign | null,
  candidates: HomeCandidate[],
): HomeFlashSaleCampaign | null {
  if (flashSaleCampaign) {
    return flashSaleCampaign;
  }

  const mockProducts = candidates
    .filter((item) => item.card.discount > 0)
    .sort((left, right) => right.card.discount - left.card.discount)
    .slice(0, 4)
    .map((item) => item.card);

  if (mockProducts.length === 0) {
    return null;
  }

  return {
    title: "Oferta Relampago",
    slug: "oferta-relampago",
    status: "active",
    startsAt: "",
    endsAt: "",
    productIds: mockProducts.map((product) => Number(product.id)).filter((id) => Number.isInteger(id)),
    label: "Oferta Relampago",
    supportingText: "Mock local ativo enquanto a campanha do WordPress nao estiver configurada.",
    products: mockProducts,
  };
}
