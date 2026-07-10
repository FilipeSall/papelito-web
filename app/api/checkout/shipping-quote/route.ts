import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

type ShippingQuoteRequestItem = {
  product_id?: unknown;
  qty?: unknown;
};

type ShippingQuoteRequestBody = {
  vendor_id?: unknown;
  destination_cep?: unknown;
  items?: unknown;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const rateLimitBuckets = new Map<string, { count: number; expiresAt: number }>();

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function resolveClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function resolveRateLimitKey(request: Request, userId: string | undefined) {
  return userId ? `user:${userId}` : `ip:${resolveClientIp(request)}`;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateLimitBuckets.get(key);

  if (!current || current.expiresAt <= now) {
    rateLimitBuckets.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  current.count += 1;
  return false;
}

function normalizeItems(items: unknown): Array<{ product_id: number; qty: number }> {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const raw = item as ShippingQuoteRequestItem;
      const productId = Number(raw?.product_id);
      const qty = Number(raw?.qty);

      if (!Number.isInteger(productId) || productId <= 0) {
        return null;
      }

      return {
        product_id: productId,
        qty: Number.isInteger(qty) && qty > 0 ? qty : 1,
      };
    })
    .filter((item): item is { product_id: number; qty: number } => item !== null);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = normalizeRole(session?.role);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json(
      {
        code: "papelito_checkout_auth_required",
        message: "Faca login para cotar o frete.",
      },
      { status: 401 },
    );
  }

  if (role !== "customer") {
    return NextResponse.json(
      {
        code: "papelito_checkout_customer_only",
        message: "Somente consumidores finais podem cotar frete no checkout.",
      },
      { status: 403 },
    );
  }

  const clientKey = resolveRateLimitKey(request, session.user.id);

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      {
        code: "papelito_rate_limited",
        message: "Muitas cotacoes de frete. Tente novamente em alguns instantes.",
      },
      { status: 429 },
    );
  }

  const payload = (await request.json().catch(() => null)) as ShippingQuoteRequestBody | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const vendorId = Number(payload.vendor_id);
  const destinationCep = typeof payload.destination_cep === "string" ? payload.destination_cep : "";
  const items = normalizeItems(payload.items);

  if (!Number.isInteger(vendorId) || vendorId <= 0 || !destinationCep || items.length === 0) {
    return NextResponse.json(
      {
        code: "papelito_shipping_invalid_request",
        message: "Dados insuficientes para cotar o frete.",
      },
      { status: 400 },
    );
  }

  const proxyToken = process.env.PAPELITO_FRONT_PROXY_TOKEN;
  const result = await wpRest<unknown>("/papelito/v1/shipping/quote", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "X-Papelito-Client-Key": clientKey,
      ...(proxyToken ? { "X-Papelito-Proxy-Token": proxyToken } : {}),
    },
    json: {
      vendor_id: vendorId,
      destination_cep: destinationCep,
      items,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.error.code,
        message: result.error.message,
        data: result.error.data,
      },
      { status: result.status || 502 },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
