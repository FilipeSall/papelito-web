import "server-only";

import type {
  AdminBenefitGroup,
  AdminBenefitGroupsSnapshot,
  BenefitGroupTargets,
} from "@/types/product-benefits";

import { wpRest } from "./wp-rest";

const ADMIN_BENEFITS_TAG = "admin-benefit-groups";

export type BenefitGroupInput = {
  name: string;
  isActive: boolean;
  items: {
    iconType: string;
    iconEmoji: string;
    iconAttachmentId: number;
    iconUrl: string;
    title: string;
    description: string;
    descriptionContent: unknown;
    isActive: boolean;
  }[];
  targets: BenefitGroupTargets;
};

export class WpBenefitsError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "WpBenefitsError";
    this.code = code;
    this.status = status;
  }
}

export function benefitsErrorResponse(error: unknown, fallback: string) {
  if (error instanceof WpBenefitsError) {
    return { body: { code: error.code, message: error.message }, status: error.status };
  }

  return { body: { code: "papelito_internal_error", message: fallback }, status: 500 };
}

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

function toSnapshot(data: Partial<AdminBenefitGroupsSnapshot>): AdminBenefitGroupsSnapshot {
  return {
    groups: Array.isArray(data.groups) ? data.groups : [],
    collections: Array.isArray(data.collections) ? data.collections : [],
    issues: Array.isArray(data.issues) ? data.issues : [],
  };
}

/**
 * Snapshot administrativo dos grupos de benefícios.
 *
 * Falha de origem vira `issues` visível na tela, nunca lista vazia silenciosa —
 * foi o silêncio do `OFFICIAL_CATEGORY_KEYS` que escondeu uma categoria inteira
 * do admin, e a lição vale igual aqui.
 */
export async function getAdminBenefitGroupsSnapshot(
  accessToken?: string,
): Promise<AdminBenefitGroupsSnapshot> {
  const result = await wpRest<Partial<AdminBenefitGroupsSnapshot>>(
    "/papelito/v1/admin/benefit-groups",
    { headers: authHeaders(accessToken), revalidate: 0, tags: [ADMIN_BENEFITS_TAG] },
  );

  if (!result.ok) {
    return {
      groups: [],
      collections: [],
      issues: [`[benefícios] ${result.error.message}`],
    };
  }

  return toSnapshot(result.data);
}

function fail(result: Extract<Awaited<ReturnType<typeof wpRest>>, { ok: false }>): never {
  throw new WpBenefitsError(
    result.error.code,
    result.error.message,
    result.status || result.error.data?.status || 500,
  );
}

export async function createBenefitGroup(
  accessToken: string | undefined,
  payload: BenefitGroupInput,
): Promise<AdminBenefitGroupsSnapshot> {
  const result = await wpRest<Partial<AdminBenefitGroupsSnapshot>>(
    "/papelito/v1/admin/benefit-groups",
    { headers: authHeaders(accessToken), json: payload, method: "POST" },
  );

  if (!result.ok) {
    fail(result);
  }

  return toSnapshot(result.data);
}

export async function updateBenefitGroup(
  accessToken: string | undefined,
  groupId: number,
  payload: BenefitGroupInput,
): Promise<AdminBenefitGroupsSnapshot> {
  const result = await wpRest<Partial<AdminBenefitGroupsSnapshot>>(
    `/papelito/v1/admin/benefit-groups/${groupId}`,
    { headers: authHeaders(accessToken), json: payload, method: "PUT" },
  );

  if (!result.ok) {
    fail(result);
  }

  return toSnapshot(result.data);
}

export async function deleteBenefitGroup(
  accessToken: string | undefined,
  groupId: number,
): Promise<AdminBenefitGroupsSnapshot> {
  const result = await wpRest<Partial<AdminBenefitGroupsSnapshot>>(
    `/papelito/v1/admin/benefit-groups/${groupId}`,
    { headers: authHeaders(accessToken), method: "DELETE" },
  );

  if (!result.ok) {
    fail(result);
  }

  return toSnapshot(result.data);
}

export type { AdminBenefitGroup };
