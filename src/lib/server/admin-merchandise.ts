import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export type AdminMerchandiseKitUsage = {
  kitId: number;
  productId: number;
  name: string;
  status: string;
  quantity: number;
};

export type AdminMerchandise = {
  id: number;
  name: string;
  imageAttachmentId: number;
  imageUrl: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  kits: AdminMerchandiseKitUsage[];
  kitCount: number;
};

export type AdminMerchandisePayload = {
  name: string;
  imageAttachmentId: number;
  weight: string;
  length: string;
  width: string;
  height: string;
  confirmImpact?: boolean;
};

/**
 * Kits que uma alteração física atinge e, dentre eles, os que deixariam de
 * atender às regras de publicação.
 */
export type AdminMerchandiseImpact = {
  affectedKits: AdminMerchandiseKitUsage[];
  breakingKits: AdminMerchandiseKitUsage[];
};

export type AdminMerchandiseDeletion = {
  deleted: true;
  merchandiseId: number;
  imageDeleted: boolean;
};

/**
 * Erro do catálogo que preserva o que a UI precisa para decidir o próximo passo.
 *
 * O 409 de confirmação carrega o impacto, e o 409 de brinde em uso carrega os
 * Kits: sem esses dados o admin só veria uma mensagem sem saída.
 */
export class AdminMerchandiseRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly impact: AdminMerchandiseImpact | null = null,
    readonly kits: AdminMerchandiseKitUsage[] = [],
  ) {
    super(message);
  }
}

function toImpact(value: unknown): AdminMerchandiseImpact | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<AdminMerchandiseImpact>;

  return {
    affectedKits: Array.isArray(raw.affectedKits) ? raw.affectedKits : [],
    breakingKits: Array.isArray(raw.breakingKits) ? raw.breakingKits : [],
  };
}

function requestError(
  error: { code: string; message: string; data?: Record<string, unknown> },
  status: number,
) {
  const data = error.data ?? {};

  return new AdminMerchandiseRequestError(
    error.message,
    status,
    error.code,
    toImpact(data.impact),
    Array.isArray(data.kits) ? (data.kits as AdminMerchandiseKitUsage[]) : [],
  );
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getAdminMerchandiseSnapshot(
  accessToken: string | undefined,
): Promise<AdminMerchandise[]> {
  if (!accessToken) return [];

  const result = await wpRest<{ items?: AdminMerchandise[] }>(
    "/papelito/v1/admin/merchandise",
    {
      headers: authHeaders(accessToken),
      revalidate: 60,
      tags: ["admin-merchandise"],
    },
  );

  return result.ok && Array.isArray(result.data.items) ? result.data.items : [];
}

export async function saveAdminMerchandise(
  accessToken: string,
  payload: AdminMerchandisePayload,
  merchandiseId?: number,
): Promise<{
  merchandise: AdminMerchandise;
  unpublishedKits: AdminMerchandiseKitUsage[];
  failedKits: AdminMerchandiseKitUsage[];
}> {
  const result = await wpRest<{
    merchandise: AdminMerchandise;
    unpublishedKits?: AdminMerchandiseKitUsage[];
    failedKits?: AdminMerchandiseKitUsage[];
  }>(`/papelito/v1/admin/merchandise${merchandiseId ? `/${merchandiseId}` : ""}`, {
    headers: authHeaders(accessToken),
    json: payload,
    method: merchandiseId ? "PUT" : "POST",
  });

  if (!result.ok) throw requestError(result.error, result.status);

  return {
    merchandise: result.data.merchandise,
    unpublishedKits: result.data.unpublishedKits ?? [],
    failedKits: result.data.failedKits ?? [],
  };
}

export async function deleteAdminMerchandise(
  accessToken: string,
  merchandiseId: number,
): Promise<AdminMerchandiseDeletion> {
  const result = await wpRest<AdminMerchandiseDeletion>(
    `/papelito/v1/admin/merchandise/${merchandiseId}`,
    { headers: authHeaders(accessToken), method: "DELETE" },
  );

  if (!result.ok) throw requestError(result.error, result.status);

  return result.data;
}
