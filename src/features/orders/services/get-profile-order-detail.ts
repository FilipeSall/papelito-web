import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ProfileOrderDetail } from "../types/profile-order-detail";

interface ProfileOrdersMockFile {
  orders: ProfileOrderDetail[];
}

/**
 * Busca os detalhes de um pedido do usuário autenticado.
 *
 * TODO(backend-orders): substituir por integração real com API de pedidos:
 * GET /api/profile/orders/:id
 */
export async function getProfileOrderDetail(
  orderId: string,
): Promise<ProfileOrderDetail | null> {
  const filePath = path.join(process.cwd(), "mock", "profile-orders.json");
  const raw = await readFile(filePath, "utf8");
  const payload = JSON.parse(raw) as ProfileOrdersMockFile;

  const order = payload.orders.find((item) => item.id === orderId);
  return order ?? null;
}
