"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import useSWR from "swr";

import { useAuthSession } from "@/hooks/use-auth-session";
import type {
  ProductAvailabilityEntry,
  ProductAvailabilityResponse,
  ProductAvailabilityStatus,
} from "../types/product-availability";

const STORAGE_PREFIX = "papelito:catalog-availability:";
const STORAGE_TTL_MS = 5 * 60 * 1000;

interface ProductAvailabilityContextValue {
  status: ProductAvailabilityStatus;
  products: Record<string, ProductAvailabilityEntry>;
}

interface ProductAvailabilityProviderProps {
  productIds: string[];
  children: ReactNode;
}

const ProductAvailabilityContext = createContext<ProductAvailabilityContextValue>({
  status: "idle",
  products: {},
});

function normalizeProductIds(productIds: string[]) {
  return Array.from(
    new Set(
      productIds
        .map((id) => id.trim())
        .filter((id) => /^\d+$/.test(id)),
    ),
  ).sort((left, right) => Number(left) - Number(right));
}

function readCachedAvailability(storageKey: string): ProductAvailabilityResponse | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as {
      expiresAt?: number;
      data?: ProductAvailabilityResponse;
    };

    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(storageKey);
      return undefined;
    }

    return parsed.data;
  } catch {
    return undefined;
  }
}

function writeCachedAvailability(
  storageKey: string,
  data: ProductAvailabilityResponse | undefined,
) {
  if (typeof window === "undefined" || !data || data.status !== "ok") {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        expiresAt: Date.now() + STORAGE_TTL_MS,
        data,
      }),
    );
  } catch {
    // localStorage is a progressive enhancement for faster repeat navigations.
  }
}

async function availabilityFetcher(url: string): Promise<ProductAvailabilityResponse> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar disponibilidade.");
  }

  return response.json() as Promise<ProductAvailabilityResponse>;
}

export function ProductAvailabilityProvider({
  productIds,
  children,
}: ProductAvailabilityProviderProps) {
  const { isAuthenticated, isLoading, isSeller } = useAuthSession();
  const normalizedIds = useMemo(() => normalizeProductIds(productIds), [productIds]);
  const idsKey = normalizedIds.join(",");
  const storageKey = `${STORAGE_PREFIX}${idsKey}`;
  const shouldFetch =
    isAuthenticated && !isLoading && !isSeller && normalizedIds.length > 0;
  const fallbackData = useMemo(
    () => (shouldFetch ? readCachedAvailability(storageKey) : undefined),
    [shouldFetch, storageKey],
  );
  const requestUrl = shouldFetch
    ? `/api/catalog/availability?productIds=${encodeURIComponent(idsKey)}`
    : null;

  const { data, error, isLoading: isAvailabilityLoading } =
    useSWR<ProductAvailabilityResponse>(requestUrl, availabilityFetcher, {
      dedupingInterval: 60_000,
      fallbackData,
      revalidateOnFocus: false,
    });

  useEffect(() => {
    writeCachedAvailability(storageKey, data);
  }, [data, storageKey]);

  const value = useMemo<ProductAvailabilityContextValue>(() => {
    if (!shouldFetch) {
      return { status: "not_applicable", products: {} };
    }

    if (error) {
      return { status: "unavailable", products: {} };
    }

    if (!data || isAvailabilityLoading) {
      return {
        status: data?.status ?? "loading",
        products: data?.products ?? {},
      };
    }

    return {
      status: data.status,
      products: data.products,
    };
  }, [data, error, isAvailabilityLoading, shouldFetch]);

  return (
    <ProductAvailabilityContext.Provider value={value}>
      {children}
    </ProductAvailabilityContext.Provider>
  );
}

export function useProductAvailability(productId: string) {
  const context = useContext(ProductAvailabilityContext);
  const entry = context.products[productId];
  const isUnavailable = context.status === "ok" && entry?.available === false;

  return {
    status: context.status,
    isUnavailable,
    disabledReason: isUnavailable
      ? "O vendor da sua região não tem esse produto."
      : undefined,
  };
}
