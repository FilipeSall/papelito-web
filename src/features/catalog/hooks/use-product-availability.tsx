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
import { REGION_BLOCK_MESSAGES } from "../types/region-block";

const STORAGE_PREFIX = "papelito:catalog-availability:v3:";
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
    throw new Error("Não foi possível consultar disponibilidade.");
  }

  return response.json() as Promise<ProductAvailabilityResponse>;
}

export function ProductAvailabilityProvider({
  productIds,
  children,
}: ProductAvailabilityProviderProps) {
  const { isAuthenticated, isLoading, role } = useAuthSession();
  const normalizedIds = useMemo(() => normalizeProductIds(productIds), [productIds]);
  const idsKey = normalizedIds.join(",");
  const storageKey = `${STORAGE_PREFIX}${idsKey}`;
  const shouldFetch =
    isAuthenticated && !isLoading && role === "customer" && normalizedIds.length > 0;
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

/**
 * Rótulo por status, exaustivo por construção.
 *
 * `unavailable` é falha da CONSULTA, não do produto: nesse estado a compra segue liberada de
 * propósito (a disponibilidade regional é camada progressiva), então afirmar "indisponível" ali
 * contradizia o botão habilitado no mesmo card. Um `Record` completo também impede que um status
 * novo caia num `else` genérico sem ninguém perceber.
 */
const AVAILABILITY_FALLBACK_LABELS: Record<ProductAvailabilityStatus, string> = {
  idle: "Consulte o CEP no produto",
  loading: "Consultando estoque",
  ok: "Estoque por região",
  not_applicable: "Consulte o CEP no produto",
  missing_cep: "Cadastre seu CEP para consultar",
  no_vendor: "Indisponível na sua região",
  unavailable: "Não foi possível consultar",
};

export function useProductAvailability(productId: string) {
  const context = useContext(ProductAvailabilityContext);
  const entry = context.products[productId];
  const regionBlockReason =
    context.status === "no_vendor"
      ? REGION_BLOCK_MESSAGES.no_vendor
      : context.status === "missing_cep"
        ? REGION_BLOCK_MESSAGES.missing_cep
        : undefined;
  const isRegionBlocked = regionBlockReason !== undefined;
  const isUnavailable =
    isRegionBlocked || (context.status === "ok" && entry?.available === false);
  const stockQty =
    typeof entry?.stockQty === "number" && Number.isFinite(entry.stockQty)
      ? Math.max(0, Math.floor(entry.stockQty))
      : null;
  const stockLabel =
    context.status === "ok" && stockQty !== null
      ? stockQty > 0
        ? `${stockQty} em estoque`
        : "Sem estoque"
      : AVAILABILITY_FALLBACK_LABELS[context.status];

  return {
    status: context.status,
    stockQty,
    stockLabel,
    isUnavailable,
    isRegionBlocked,
    regionBlockReason,
    disabledReason:
      regionBlockReason ??
      (isUnavailable ? "O vendor da sua região não tem esse produto." : undefined),
  };
}
