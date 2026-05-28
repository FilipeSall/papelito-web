import { createHash } from "node:crypto";

import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { getActiveVendor } from "@/features/active-vendor/server";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getCoverage } from "@/features/catalog/services/get-coverage";
import type { ProductAvailabilityResponse } from "@/features/catalog/types/product-availability";
import { authOptions } from "@/lib/auth";
import {
  getAccountActiveVendorTag,
  getAccountCoverageCepTag,
} from "@/lib/server/account-cache-tags";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function resolveAccountId(session: {
  user?: {
    id?: string;
    email?: string | null;
  };
} | null) {
  return session?.user?.id ?? session?.user?.email ?? "anonymous";
}

function parseProductIds(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((id) => id.trim())
        .filter((id) => /^\d+$/.test(id))
        .slice(0, 120),
    ),
  );
}

function productIdsHash(productIds: string[]) {
  return createHash("sha256").update(productIds.join(",")).digest("hex").slice(0, 16);
}

function notApplicable(): ProductAvailabilityResponse {
  return {
    status: "not_applicable",
    products: {},
  };
}

function getCachedAvailability(input: {
  accountId: string;
  cep: string;
  activeVendorId: number;
  productIds: string[];
}) {
  const idsHash = productIdsHash(input.productIds);

  return unstable_cache(
    async () => getCoverage(input.cep, input.productIds, input.activeVendorId),
    [
      "catalog-availability",
      input.accountId,
      input.cep,
      String(input.activeVendorId),
      idsHash,
    ],
    {
      revalidate: 300,
      tags: [
        "wp:coverage",
        getAccountCoverageCepTag(input.accountId),
        getAccountActiveVendorTag(input.accountId),
      ],
    },
  )();
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken || normalizeRole(session.role) === "seller") {
    return NextResponse.json(notApplicable());
  }

  const productIds = parseProductIds(new URL(request.url).searchParams.get("productIds"));

  if (productIds.length === 0) {
    return NextResponse.json(notApplicable());
  }

  const accountId = resolveAccountId(session);
  const [coverageContext, activeVendorResult] = await Promise.all([
    getAccountCoverageCepContext(),
    getActiveVendor(),
  ]);

  if (!coverageContext.cep || !activeVendorResult.ok) {
    return NextResponse.json(notApplicable());
  }

  try {
    const coverage = await getCachedAvailability({
      accountId,
      cep: coverageContext.cep,
      activeVendorId: activeVendorResult.vendor.vendorId,
      productIds,
    });

    return NextResponse.json<ProductAvailabilityResponse>({
      status: "ok",
      products: Object.fromEntries(
        productIds.map((productId) => [
          productId,
          { available: coverage[productId]?.hasCoverage === true },
        ]),
      ),
    });
  } catch {
    return NextResponse.json<ProductAvailabilityResponse>(
      {
        status: "unavailable",
        products: {},
      },
      { status: 200 },
    );
  }
}
