import { NextResponse } from "next/server";

import {
  mapVendorOrdersSnapshot,
  type WpVendorOrdersList,
} from "@/features/vendor-orders/services/vendor-order-mappers";
import { VENDOR_ORDERS_PER_PAGE } from "@/features/vendor-orders/types/vendor-orders";
import { wpRest } from "@/lib/server/wp-rest";
import {
  normalizeVendorOrdersFiscal,
  normalizeVendorOrdersStatus,
  parseVendorOrdersPage,
  parseVendorOrdersSearch,
} from "@/features/vendor-orders/utils/vendor-order-filters";

import { readWithVendorAccessToken } from "../_lib/require-vendor-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseVendorOrdersPage(url.searchParams.get("page"));
  const search = parseVendorOrdersSearch(url.searchParams.get("search"));
  const status = normalizeVendorOrdersStatus(url.searchParams.get("status"));
  const fiscal = normalizeVendorOrdersFiscal(url.searchParams.get("fiscal"));
  // A mesma constante do render no servidor: com dois tamanhos de pagina, o
  // envelope que o SWR recebe tem outro `total_pages` e a lista trocava de
  // tamanho sozinha na primeira revalidacao.
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(VENDOR_ORDERS_PER_PAGE),
    status,
  });

  if (search) {
    params.set("search", search);
  }
  if (fiscal !== "all") {
    params.set("fiscal", fiscal);
  }

  const session = await readWithVendorAccessToken((accessToken) =>
    wpRest<WpVendorOrdersList>(`/papelito/v1/vendor/me/orders?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = session.data;

  return result.ok
    ? NextResponse.json(mapVendorOrdersSnapshot(result.data))
    : NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
}
