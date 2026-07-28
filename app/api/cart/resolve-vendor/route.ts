import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

type ResolveVendorPayload = {
  product?: {
    id?: unknown;
    quantity?: unknown;
  };
  currentItems?: unknown;
};

type ResolveVendorCurrentItem = {
  id: string;
  quantity: number;
  vendorId: number;
};

type WpCoverageVendor = {
  vendor_id?: number;
  store_name?: string;
  city?: string;
  state?: string;
  distance_km?: number;
  qty?: number;
  lead_time_days?: number;
};

type WpProductCoverage = {
  has_coverage?: boolean;
  best_vendor?: WpCoverageVendor | null;
  alternatives?: WpCoverageVendor[];
};

type WpCoverageResponse = Record<string, WpProductCoverage>;

type ResolvedVendor = {
  vendorId: number;
  vendorName: string;
  city?: string;
  state?: string;
  distanceKm?: number;
  leadTimeDays?: number;
};

type DesiredItem = {
  id: string;
  quantity: number;
};

function normalizeProductId(value: unknown) {
  const id = typeof value === "string" ? value : String(value ?? "");
  const numericId = Number(id);

  return Number.isInteger(numericId) && numericId > 0 ? String(numericId) : null;
}

function normalizeQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(value);

  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
}

function normalizeCurrentItems(value: unknown): ResolveVendorCurrentItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = normalizeProductId(record.id);
      const vendorId =
        typeof record.vendorId === "number"
          ? record.vendorId
          : Number(record.vendorId);

      if (!id || !Number.isInteger(vendorId) || vendorId <= 0) {
        return null;
      }

      return {
        id,
        quantity: normalizeQuantity(record.quantity),
        vendorId,
      };
    })
    .filter((item): item is ResolveVendorCurrentItem => item !== null);
}

function buildDesiredItems(
  currentItems: ResolveVendorCurrentItem[],
  product: DesiredItem,
): DesiredItem[] {
  const quantities = new Map<string, number>();

  for (const item of currentItems) {
    quantities.set(item.id, (quantities.get(item.id) ?? 0) + item.quantity);
  }

  quantities.set(product.id, (quantities.get(product.id) ?? 0) + product.quantity);

  return Array.from(quantities.entries()).map(([id, quantity]) => ({
    id,
    quantity,
  }));
}

function getCurrentVendorId(currentItems: ResolveVendorCurrentItem[]) {
  if (currentItems.length === 0) {
    return null;
  }

  const vendorIds = new Set(currentItems.map((item) => item.vendorId));

  return vendorIds.size === 1 ? currentItems[0].vendorId : null;
}

function mapVendor(vendor: WpCoverageVendor): ResolvedVendor | null {
  const vendorId =
    typeof vendor.vendor_id === "number" ? vendor.vendor_id : Number(vendor.vendor_id);
  const vendorName = typeof vendor.store_name === "string" ? vendor.store_name.trim() : "";

  if (!Number.isInteger(vendorId) || vendorId <= 0 || !vendorName) {
    return null;
  }

  return {
    vendorId,
    vendorName,
    city: typeof vendor.city === "string" && vendor.city ? vendor.city : undefined,
    state: typeof vendor.state === "string" && vendor.state ? vendor.state : undefined,
    distanceKm:
      typeof vendor.distance_km === "number" && Number.isFinite(vendor.distance_km)
        ? vendor.distance_km
        : undefined,
    leadTimeDays:
      typeof vendor.lead_time_days === "number" &&
      Number.isFinite(vendor.lead_time_days)
        ? vendor.lead_time_days
        : undefined,
  };
}

function buildQuantitiesParam(items: DesiredItem[]) {
  return items.map((item) => `${item.id}:${item.quantity}`).join(",");
}

async function fetchCoverageByProduct(
  cep: string,
  items: DesiredItem[],
): Promise<Map<string, ResolvedVendor[]> | null> {
  if (items.length === 0) {
    return new Map();
  }

  const params = new URLSearchParams({
    cep,
    product_ids: items.map((item) => item.id).join(","),
    quantities: buildQuantitiesParam(items),
  });
  const result = await wpRest<WpCoverageResponse>(
    `/papelito/v1/coverage/products?${params.toString()}`,
    { revalidate: 0 },
  );

  if (!result.ok) {
    return null;
  }

  const coverageByProduct = new Map<string, ResolvedVendor[]>();

  for (const item of items) {
    const coverage = result.data[item.id];

    if (!coverage?.has_coverage || !coverage.best_vendor) {
      coverageByProduct.set(item.id, []);
      continue;
    }

    coverageByProduct.set(
      item.id,
      [coverage.best_vendor, ...(coverage.alternatives ?? [])]
        .map(mapVendor)
        .filter((vendor): vendor is ResolvedVendor => vendor !== null),
    );
  }

  return coverageByProduct;
}

function findVendor(
  coverageByProduct: Map<string, ResolvedVendor[]>,
  vendorId: number,
) {
  for (const vendors of coverageByProduct.values()) {
    const vendor = vendors.find((item) => item.vendorId === vendorId);

    if (vendor) {
      return vendor;
    }
  }

  return null;
}

function vendorCoversAll(
  coverageByProduct: Map<string, ResolvedVendor[]>,
  vendorId: number,
) {
  return Array.from(coverageByProduct.values()).every((vendors) =>
    vendors.some((vendor) => vendor.vendorId === vendorId),
  );
}

function getVendorDistanceScore(
  coverageByProduct: Map<string, ResolvedVendor[]>,
  vendorId: number,
) {
  let total = 0;
  let count = 0;

  for (const vendors of coverageByProduct.values()) {
    const vendor = vendors.find((item) => item.vendorId === vendorId);

    if (vendor?.distanceKm !== undefined) {
      total += vendor.distanceKm;
      count += 1;
    }
  }

  return count > 0 ? total / count : Number.POSITIVE_INFINITY;
}

function resolvePreferredVendor(
  coverageByProduct: Map<string, ResolvedVendor[]>,
  currentVendorId: number | null,
) {
  if (currentVendorId && vendorCoversAll(coverageByProduct, currentVendorId)) {
    return findVendor(coverageByProduct, currentVendorId);
  }

  const candidateIds = new Set<number>();

  for (const vendors of coverageByProduct.values()) {
    for (const vendor of vendors) {
      candidateIds.add(vendor.vendorId);
    }
  }

  const candidates = Array.from(candidateIds)
    .filter((vendorId) => vendorCoversAll(coverageByProduct, vendorId))
    .map((vendorId) => ({
      vendor: findVendor(coverageByProduct, vendorId),
      score: getVendorDistanceScore(coverageByProduct, vendorId),
    }))
    .filter(
      (candidate): candidate is { vendor: ResolvedVendor; score: number } =>
        candidate.vendor !== null,
    )
    .sort((left, right) => {
      const scoreCompare = left.score - right.score;

      if (scoreCompare !== 0) {
        return scoreCompare;
      }

      return left.vendor.vendorId - right.vendor.vendorId;
    });

  return candidates[0]?.vendor ?? null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json(
      { status: "unavailable", message: "Não autenticado." },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as ResolveVendorPayload | null;
  const productId = normalizeProductId(payload?.product?.id);

  if (!payload || !productId) {
    return NextResponse.json(
      { status: "unavailable", message: "Produto inválido." },
      { status: 422 },
    );
  }

  const coverageContext = await getAccountCoverageCepContext();

  if (!coverageContext.cep) {
    return NextResponse.json({
      status: "missing_cep",
      message: "Cadastre um CEP na sua conta para validar o vendor antes de comprar.",
      href: "/perfil/enderecos",
    });
  }

  const currentItems = normalizeCurrentItems(payload.currentItems);
  const desiredItems = buildDesiredItems(currentItems, {
    id: productId,
    quantity: normalizeQuantity(payload.product?.quantity),
  });
  const coverageByProduct = await fetchCoverageByProduct(coverageContext.cep, desiredItems);

  if (coverageByProduct === null) {
    return NextResponse.json({
      status: "unavailable",
      message: "Não foi possível validar a disponibilidade por CEP agora.",
    });
  }

  for (const item of desiredItems) {
    const vendors = coverageByProduct.get(item.id) ?? [];

    if (vendors.length === 0) {
      return NextResponse.json({
        status: "unavailable",
        message: "Este produto não está disponível para o seu CEP no momento.",
      });
    }
  }

  const vendor = resolvePreferredVendor(
    coverageByProduct,
    getCurrentVendorId(currentItems),
  );

  if (!vendor) {
    return NextResponse.json({
      status: "vendor_conflict",
      message:
        "Este item não pode ser adicionado porque nenhum vendor atende todos os produtos do carrinho.",
    });
  }

  return NextResponse.json({
    status: "ok",
    vendor,
  });
}
