import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

import { CHAMADOS_DEFAULT_PER_PAGE } from "../constants";
import {
  mapChamado,
  mapChamadoReasonCatalog,
  mapChamadosSnapshot,
  type WpChamado,
  type WpChamadoReasonCatalog,
  type WpChamadosSnapshot,
} from "./chamado-mappers";
import type { Chamado, ChamadoReasonCatalog, ChamadosSnapshot } from "../types/chamado";

export type ChamadosQuery = {
  /** `chamado` traz só conversas com pedido; `solicitacao`, só as sem pedido. */
  kind?: "chamado" | "solicitacao";
  orderId?: number;
  page?: number;
  reason?: string;
  search?: string;
  status?: "ABERTO" | "ENCERRADO";
};

async function getChamadoAccessToken() {
  const session = await getServerSession(authOptions);
  return session?.accessToken ?? null;
}

export async function getChamados({
  kind,
  orderId,
  page = 1,
  reason = "",
  search = "",
  status,
}: ChamadosQuery = {}): Promise<ChamadosSnapshot> {
  const accessToken = await getChamadoAccessToken();
  const empty = { items: [], page, perPage: CHAMADOS_DEFAULT_PER_PAGE, total: 0, totalPages: 1 };

  if (!accessToken) return empty;

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(CHAMADOS_DEFAULT_PER_PAGE),
  });

  if (kind) params.set("kind", kind);
  if (orderId && orderId > 0) params.set("order_id", String(orderId));
  if (reason.trim()) params.set("reason", reason.trim());
  if (search.trim()) params.set("search", search.trim());
  if (status) params.set("status", status);

  const result = await wpRest<WpChamadosSnapshot>(
    `/papelito/v1/messages/threads?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, revalidate: 15, tags: ["chamados"] },
  );

  return result.ok ? mapChamadosSnapshot(result.data) : empty;
}

export async function getChamado(threadId: string | number): Promise<Chamado | null> {
  const accessToken = await getChamadoAccessToken();
  const id = String(threadId);

  if (!accessToken || !/^\d+$/.test(id)) return null;

  const result = await wpRest<WpChamado>(`/papelito/v1/messages/threads/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return result.ok ? mapChamado(result.data) : null;
}

/**
 * Chamados de um pedido — plural desde que `uniq_order` caiu.
 *
 * A versão singular pegava `items[0]` e escolhia um chamado arbitrário entre vários; era um bug
 * esperando o segundo chamado do mesmo pedido para aparecer.
 */
export async function getOrderChamados(orderId: string | number): Promise<ChamadosSnapshot> {
  const id = Number(orderId);

  return Number.isInteger(id) && id > 0
    ? getChamados({ kind: "chamado", orderId: id })
    : { items: [], page: 1, perPage: CHAMADOS_DEFAULT_PER_PAGE, total: 0, totalPages: 1 };
}

export async function getChamadoReasons(): Promise<ChamadoReasonCatalog> {
  const accessToken = await getChamadoAccessToken();

  if (!accessToken) return { reasons: [], returnReasons: [] };

  const result = await wpRest<WpChamadoReasonCatalog>("/papelito/v1/messages/chamado-reasons", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 300,
    tags: ["chamado-reasons"],
  });

  return result.ok ? mapChamadoReasonCatalog(result.data) : { reasons: [], returnReasons: [] };
}
