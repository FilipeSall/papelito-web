import { NextResponse } from "next/server";

import {
  mapVendorOrdersSnapshot,
  type WpVendorOrdersList,
} from "@/features/vendor-orders/services/vendor-order-mappers";
import { wpRest } from "@/lib/server/wp-rest";
import {
  normalizeVendorOrdersStatus,
  parseVendorOrdersPage,
  parseVendorOrdersSearch,
} from "@/features/vendor-orders/utils/vendor-order-filters";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

export async function GET(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const page = parseVendorOrdersPage(url.searchParams.get("page"));
  const search = parseVendorOrdersSearch(url.searchParams.get("search"));
  const status = normalizeVendorOrdersStatus(url.searchParams.get("status"));
  const params = new URLSearchParams({
    page: String(page),
    per_page: "20",
    status,
  });

  if (search) {
    params.set("search", search);
  }

  const result = await wpRest<WpVendorOrdersList>(`/papelito/v1/vendor/me/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  return result.ok
    ? NextResponse.json(mapVendorOrdersSnapshot(result.data))
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
