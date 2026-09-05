import "server-only";

import { getSellerAccessToken } from "@/lib/server/vendor-session";
import { wpRest } from "@/lib/server/wp-rest";

import {
  mapVendorOrderDetail,
  mapVendorOrdersSnapshot,
  type WpVendorOrder,
  type WpVendorOrdersList,
} from "./vendor-order-mappers";
import { VENDOR_ORDERS_PER_PAGE } from "../types/vendor-orders";
import type {
  VendorOrderDetail,
  VendorOrdersFilters,
  VendorOrdersSnapshot,
  VendorOrdersSummary,
} from "../types/vendor-orders";

const emptySummary: VendorOrdersSummary = {
  all: 0,
  aguardando_pagamento: 0,
  aguardando_estoque: 0,
  aguardando_envio: 0,
  em_separacao: 0,
  enviado: 0,
  entregue: 0,
  cancelado: 0,
  fiscal_pending: 0,
};

/**
 * Snapshot vazio marcado como falha de leitura.
 *
 * `unavailable` existe para a tela não dizer "fila vazia" quando o que houve
 * foi sessão morta ou WordPress fora do ar — o vendor concluiria que não tem
 * pedido nenhum.
 */
function unavailableSnapshot(filters: VendorOrdersFilters): VendorOrdersSnapshot {
  return {
    items: [],
    page: filters.page,
    perPage: VENDOR_ORDERS_PER_PAGE,
    summary: emptySummary,
    total: 0,
    totalPages: 1,
    unavailable: true,
  };
}

export async function getVendorOrders(filters: VendorOrdersFilters): Promise<VendorOrdersSnapshot> {
  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return unavailableSnapshot(filters);
  }

  const params = new URLSearchParams({
    page: String(filters.page),
    per_page: String(VENDOR_ORDERS_PER_PAGE),
    status: filters.status,
  });
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.fiscal !== "all") {
    params.set("fiscal", filters.fiscal);
  }

  const result = await wpRest<WpVendorOrdersList>(`/papelito/v1/vendor/me/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 30,
    tags: ["vendor-orders"],
  });

  return result.ok ? mapVendorOrdersSnapshot(result.data) : unavailableSnapshot(filters);
}

/**
 * Resultado do detalhe, com os três desfechos separados.
 *
 * Colapsar tudo em `null` fazia a tela responder 404 para sessão expirada e
 * para WordPress fora do ar — o vendor lia "este pedido não existe" quando o
 * pedido existe e o problema é outro, e não tinha como agir sobre isso.
 */
export type VendorOrderDetailResult =
  | { order: VendorOrderDetail; status: "ok" }
  | { status: "not-found" }
  | { status: "unauthenticated" }
  | { message: string; status: "error" };

export async function getVendorOrderDetail(orderId: string): Promise<VendorOrderDetailResult> {
  if (!/^\d+$/.test(orderId)) {
    return { status: "not-found" };
  }

  const accessToken = await getSellerAccessToken();

  if (!accessToken) {
    return { status: "unauthenticated" };
  }

  // Sem cache, pelo mesmo motivo de `getAdminUserDetail`: depois de uma ação do
  // vendor — transição de status, postagem, nota fiscal — o `router.refresh()`
  // precisa reler o pedido. Com `revalidate`, a tela mostrava a confirmação de
  // sucesso e o estado anterior ao mesmo tempo.
  const result = await wpRest<WpVendorOrder>(`/papelito/v1/vendor/me/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (result.ok) {
    return { order: mapVendorOrderDetail(result.data), status: "ok" };
  }

  // 404 é a resposta do WordPress tanto para pedido inexistente quanto para
  // pedido de outro vendor, e as duas devem virar a mesma tela: confirmar qual
  // dos dois é entregaria a existência do pedido alheio.
  if (result.status === 404) {
    return { status: "not-found" };
  }

  if (result.status === 401 || result.status === 403) {
    return { status: "unauthenticated" };
  }

  return { message: result.error.message, status: "error" };
}
