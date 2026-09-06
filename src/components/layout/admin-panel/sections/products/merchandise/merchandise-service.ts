"use client";

import type {
  AdminMerchandise,
  AdminMerchandiseDeletion,
  AdminMerchandiseImpact,
  AdminMerchandiseKitUsage,
} from "@/lib/server/admin-merchandise";

import { toMerchandisePayload, type MerchandiseDraft } from "./merchandise-draft";

export type MerchandiseSaveResult = {
  merchandise: AdminMerchandise;
  unpublishedKits: AdminMerchandiseKitUsage[];
  /** Kits que quebraram e o backend não conseguiu despublicar. */
  failedKits: AdminMerchandiseKitUsage[];
};

/**
 * Erro do catálogo que a UI precisa distinguir.
 *
 * `impact` chega quando o backend pede confirmação antes de despublicar Kits;
 * `kits` chega quando a exclusão é barrada por uso.
 */
export class MerchandiseError extends Error {
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

type ErrorBody = {
  code?: string;
  message?: string;
  impact?: AdminMerchandiseImpact | null;
  kits?: AdminMerchandiseKitUsage[];
};

async function readError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;

  return new MerchandiseError(
    body?.message ?? fallback,
    response.status,
    body?.code ?? "papelito_unknown",
    body?.impact ?? null,
    Array.isArray(body?.kits) ? body.kits : [],
  );
}

export async function saveMerchandiseDraft(
  draft: MerchandiseDraft,
  options: { confirmImpact?: boolean } = {},
): Promise<MerchandiseSaveResult> {
  const response = await fetch(
    draft.id ? `/api/admin/merchandise/${draft.id}` : "/api/admin/merchandise",
    {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toMerchandisePayload(draft, options)),
    },
  );

  if (!response.ok) {
    throw await readError(response, "Não foi possível salvar o brinde.");
  }

  const body = (await response.json()) as Partial<MerchandiseSaveResult>;

  if (!body.merchandise) {
    throw new MerchandiseError(
      "Não foi possível salvar o brinde.",
      response.status,
      "papelito_unknown",
    );
  }

  return {
    merchandise: body.merchandise,
    unpublishedKits: body.unpublishedKits ?? [],
    failedKits: body.failedKits ?? [],
  };
}

export async function deleteMerchandise(
  merchandiseId: number,
): Promise<AdminMerchandiseDeletion> {
  const response = await fetch(`/api/admin/merchandise/${merchandiseId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await readError(response, "Não foi possível excluir o brinde.");
  }

  return (await response.json()) as AdminMerchandiseDeletion;
}
