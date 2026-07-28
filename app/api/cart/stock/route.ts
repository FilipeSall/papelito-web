import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

type CartStockPayload = {
  items?: unknown;
};

type CartStockItem = {
  productId: number;
  vendorId: number;
};

type WpCoverageResponse = Record<
  string,
  {
    has_coverage?: boolean;
    best_vendor?: {
      vendor_id?: number;
      qty?: number;
    } | null;
  }
>;

function unavailable(message: string, status = 503) {
  return NextResponse.json({ status: "unavailable", message }, { status });
}

function normalizeItems(value: unknown): CartStockItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 120) {
    return null;
  }

  const items = new Map<number, CartStockItem>();

  for (const valueItem of value) {
    if (typeof valueItem !== "object" || valueItem === null) return null;

    const record = valueItem as Record<string, unknown>;
    const productId = Number(record.productId);
    const vendorId = Number(record.vendorId);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(vendorId) ||
      vendorId <= 0
    ) {
      return null;
    }

    const existing = items.get(productId);
    if (existing && existing.vendorId !== vendorId) return null;

    items.set(productId, { productId, vendorId });
  }

  return Array.from(items.values());
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return unavailable("Faca login para validar o estoque do carrinho.", 401);
  }

  if (session.role !== "customer") {
    return unavailable("Somente consumidores podem validar o carrinho.", 403);
  }

  const payload = (await request.json().catch(() => null)) as CartStockPayload | null;
  const items = normalizeItems(payload?.items);

  if (!items) {
    return unavailable("Itens inválidos para validar o estoque.", 422);
  }

  const coverageContext = await getAccountCoverageCepContext();
  if (!coverageContext.cep) {
    return unavailable("Cadastre um CEP na sua conta para validar o estoque.", 422);
  }

  const productIdsByVendor = new Map<number, number[]>();
  for (const item of items) {
    const productIds = productIdsByVendor.get(item.vendorId) ?? [];
    productIds.push(item.productId);
    productIdsByVendor.set(item.vendorId, productIds);
  }

  const results = await Promise.all(
    Array.from(productIdsByVendor.entries()).map(async ([vendorId, productIds]) => {
      const params = new URLSearchParams({
        cep: coverageContext.cep!,
        product_ids: productIds.join(","),
        qty: "1",
        vendor_id: String(vendorId),
      });
      const result = await wpRest<WpCoverageResponse>(
        `/papelito/v1/coverage/products?${params.toString()}`,
        { revalidate: 0 },
      );

      return { vendorId, productIds, result };
    }),
  );

  const products: Record<string, { available: boolean; stockQty: number }> = {};

  for (const { vendorId, productIds, result } of results) {
    if (!result.ok) {
      return unavailable("Não foi possível validar o estoque agora. Tente novamente.");
    }

    for (const productId of productIds) {
      const coverage = result.data[String(productId)];
      const rawQty = coverage?.best_vendor?.qty;
      const stockQty =
        coverage?.has_coverage === true &&
        coverage.best_vendor?.vendor_id === vendorId &&
        typeof rawQty === "number" &&
        Number.isFinite(rawQty)
          ? Math.max(0, Math.floor(rawQty))
          : 0;

      products[String(productId)] = {
        available: stockQty > 0,
        stockQty,
      };
    }
  }

  return NextResponse.json({ status: "ok", products });
}
