import { createHash } from "node:crypto";

import { getServerSession } from "next-auth";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { getActiveVendor } from "@/features/active-vendor/server";
import { getAccountCoverageCepContext } from "@/features/catalog/services/get-account-coverage-cep";
import { getCoverage } from "@/features/catalog/services/get-coverage";
import { normalizeUserCep } from "@/features/catalog/constants/user-cep";
import type { ProductAvailabilityResponse } from "@/features/catalog/types/product-availability";
import { authOptions } from "@/lib/auth";
import {
  getAccountActiveVendorTag,
  getAccountCoverageCepTag,
} from "@/lib/server/account-cache-tags";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function resolveAccountId(
  session: {
    user?: {
      id?: string;
      email?: string | null;
    };
  } | null,
) {
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
  return createHash("sha256")
    .update(productIds.join(","))
    .digest("hex")
    .slice(0, 16);
}

const PUBLIC_RATE_LIMIT_WINDOW_MS = 60_000;
const PUBLIC_RATE_LIMIT_MAX_REQUESTS = 20;
const publicRateLimitBuckets = new Map<
  string,
  { count: number; expiresAt: number }
>();

function resolveClientIp(request: Request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function isPublicRateLimited(request: Request) {
  const key = resolveClientIp(request);
  const now = Date.now();
  const current = publicRateLimitBuckets.get(key);

  if (!current || current.expiresAt <= now) {
    publicRateLimitBuckets.set(key, {
      count: 1,
      expiresAt: now + PUBLIC_RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (current.count >= PUBLIC_RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  return false;
}

function notApplicable(): ProductAvailabilityResponse {
  return {
    status: "not_applicable",
    products: {},
  };
}

function noVendorAvailability(
  productIds: string[],
): ProductAvailabilityResponse {
  return {
    status: "no_vendor",
    products: Object.fromEntries(
      productIds.map((productId) => [
        productId,
        { available: false, stockQty: 0 },
      ]),
    ),
  };
}

function missingCepAvailability(): ProductAvailabilityResponse {
  return {
    status: "missing_cep",
    products: {},
  };
}

function unavailableAvailability(): ProductAvailabilityResponse {
  return {
    status: "unavailable",
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

function getCachedPublicAvailability(cep: string, productId: string) {
  return unstable_cache(
    async () => getCoverage(cep, [productId]),
    ["catalog-public-availability", cep, productId],
    {
      revalidate: 300,
      tags: ["wp:coverage"],
    },
  )();
}

async function getPublicAvailability(
  request: Request,
  cepValue: string | null,
  productIds: string[],
) {
  const cep = normalizeUserCep(cepValue);

  if (!cep || productIds.length !== 1) {
    return NextResponse.json(
      {
        code: "papelito_public_availability_invalid_request",
        message:
          "Informe um CEP válido e apenas um produto para consultar disponibilidade.",
      },
      { status: 400 },
    );
  }

  if (isPublicRateLimited(request)) {
    return NextResponse.json(
      {
        code: "papelito_rate_limited",
        message:
          "Muitas consultas de disponibilidade. Tente novamente em alguns instantes.",
      },
      { status: 429 },
    );
  }

  const productId = productIds[0];

  try {
    const coverage = await getCachedPublicAvailability(cep, productId);

    return NextResponse.json<ProductAvailabilityResponse>({
      status: "ok",
      products: {
        [productId]: {
          available: coverage[productId]?.hasCoverage === true,
          stockQty: coverage[productId]?.hasCoverage === true ? 1 : 0,
        },
      },
    });
  } catch {
    return NextResponse.json(unavailableAvailability());
  }
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const productIds = parseProductIds(searchParams.get("productIds"));
  const publicCep = searchParams.get("cep");

  if (publicCep !== null) {
    return getPublicAvailability(request, publicCep, productIds);
  }

  const session = await getServerSession(authOptions);
  const role = normalizeRole(session?.role);

  if (!session?.user || !session.accessToken || role !== "customer") {
    return NextResponse.json(notApplicable());
  }

  if (productIds.length === 0) {
    return NextResponse.json(notApplicable());
  }

  const accountId = resolveAccountId(session);
  const [coverageContext, activeVendorResult] = await Promise.all([
    getAccountCoverageCepContext(),
    getActiveVendor(),
  ]);

  if (!coverageContext.cep) {
    return NextResponse.json(missingCepAvailability());
  }

  if (!activeVendorResult.ok) {
    if (activeVendorResult.error.reason === "no_vendor_available") {
      return NextResponse.json(noVendorAvailability(productIds));
    }

    return NextResponse.json(unavailableAvailability());
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
          {
            available: coverage[productId]?.hasCoverage === true,
            stockQty: coverage[productId]?.bestVendor?.qty ?? 0,
          },
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
