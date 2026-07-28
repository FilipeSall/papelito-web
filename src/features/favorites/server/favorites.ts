import "server-only";

import { wpGraphqlRequest } from "@/lib/server/wp-graphql";
import type {
  FavoriteMutationResult,
  FavoriteProductItem,
  FavoritesPayload,
} from "../types/favorites";

const FAVORITE_PRODUCT_FIELDS = `
  databaseId
  name
  slug
  image {
    sourceUrl
    altText
  }
  productCategories(first: 1) {
    nodes {
      name
    }
  }
  ... on SimpleProduct {
    price
    regularPrice
    salePrice
    stockStatus
  }
  ... on VariableProduct {
    price
    regularPrice
    salePrice
    stockStatus
  }
`;

const MY_FAVORITES_QUERY = `
  query MyFavorites {
    customer {
      favoritesCount
      favorites {
        productId
        addedAt
        product {
          ${FAVORITE_PRODUCT_FIELDS}
        }
      }
    }
  }
`;

const PRODUCT_FAVORITE_STATUS_QUERY = `
  query ProductFavoriteStatus($productId: ID!) {
    product(id: $productId, idType: DATABASE_ID) {
      databaseId
      isFavorite
    }
  }
`;

const ADD_FAVORITE_MUTATION = `
  mutation AddFavorite($productId: Int!) {
    addFavoriteProduct(input: { productId: $productId }) {
      success
      isFavorite
      favoritesCount
      productId
    }
  }
`;

const REMOVE_FAVORITE_MUTATION = `
  mutation RemoveFavorite($productId: Int!) {
    removeFavoriteProduct(input: { productId: $productId }) {
      success
      isFavorite
      favoritesCount
      productId
    }
  }
`;

type FavoriteProductNode = {
  databaseId?: number | null;
  name?: string | null;
  slug?: string | null;
  image?: {
    sourceUrl?: string | null;
  } | null;
  productCategories?: {
    nodes?: Array<{
      name?: string | null;
    } | null> | null;
  } | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
} | null;

type FavoriteNode = {
  productId?: number | null;
  addedAt?: string | null;
  product?: FavoriteProductNode;
} | null;

type FavoritesQueryResponse = {
  customer?: {
    favoritesCount?: number | null;
    favorites?: FavoriteNode[] | null;
  } | null;
};

type ProductFavoriteStatusResponse = {
  product?: {
    databaseId?: number | null;
    isFavorite?: boolean | null;
  } | null;
};

type FavoriteMutationResponse = {
  addFavoriteProduct?: FavoriteMutationResult | null;
  removeFavoriteProduct?: FavoriteMutationResult | null;
};

function parseMoney(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return 0;
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
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function mapFavoriteNode(node: FavoriteNode): FavoriteProductItem | null {
  const productId = node?.productId;
  const product = node?.product;

  if (!productId || !product?.databaseId || !product.name) {
    return null;
  }

  const regularPrice = parseMoney(product.regularPrice);
  const salePrice = parseMoney(product.salePrice);
  const price = parseMoney(product.price);
  const currentPrice = salePrice > 0 ? salePrice : price > 0 ? price : regularPrice;
  const originalPrice = regularPrice > 0 ? regularPrice : currentPrice;
  const category = product.productCategories?.nodes?.[0]?.name?.trim() || "Produto";

  return {
    productId: String(productId),
    addedAt: String(node?.addedAt ?? ""),
    category,
    name: product.name,
    slug: product.slug ?? "",
    image: product.image?.sourceUrl ?? undefined,
    price: currentPrice,
    originalPrice,
    stockStatus: product.stockStatus ?? "",
  };
}

export async function fetchFavorites(accessToken?: string): Promise<FavoritesPayload> {
  if (!accessToken) {
    return { items: [], count: 0 };
  }

  const data = await wpGraphqlRequest<FavoritesQueryResponse>(
    MY_FAVORITES_QUERY,
    undefined,
    { token: accessToken, cache: "no-store" },
  );

  const items = (data.customer?.favorites ?? []).map(mapFavoriteNode).filter(Boolean) as FavoriteProductItem[];
  const count = typeof data.customer?.favoritesCount === "number"
    ? data.customer.favoritesCount
    : items.length;

  return { items, count };
}

export async function fetchProductFavoriteStatus(
  productId: string,
  accessToken?: string,
): Promise<boolean> {
  if (!accessToken) {
    return false;
  }

  const numericId = Number(productId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return false;
  }

  const data = await wpGraphqlRequest<ProductFavoriteStatusResponse>(
    PRODUCT_FAVORITE_STATUS_QUERY,
    { productId: numericId },
    { token: accessToken, cache: "no-store" },
  );

  return Boolean(data.product?.isFavorite);
}

export async function addFavoriteProduct(
  accessToken: string,
  productId: number,
): Promise<FavoriteMutationResult> {
  const data = await wpGraphqlRequest<FavoriteMutationResponse>(
    ADD_FAVORITE_MUTATION,
    { productId },
    { token: accessToken, cache: "no-store" },
  );

  if (!data.addFavoriteProduct) {
    throw new Error("Não foi possível adicionar o produto aos favoritos.");
  }

  return data.addFavoriteProduct;
}

export async function removeFavoriteProduct(
  accessToken: string,
  productId: number,
): Promise<FavoriteMutationResult> {
  const data = await wpGraphqlRequest<FavoriteMutationResponse>(
    REMOVE_FAVORITE_MUTATION,
    { productId },
    { token: accessToken, cache: "no-store" },
  );

  if (!data.removeFavoriteProduct) {
    throw new Error("Não foi possível remover o produto dos favoritos.");
  }

  return data.removeFavoriteProduct;
}
