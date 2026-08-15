import "server-only";

import { wpRest } from "./wp-rest";

export type AdminSubcategory = {
  archivedAt: string | null;
  categoryId: number;
  description: string;
  facet: string;
  id: number;
  isActive: boolean;
  name: string;
  productCount: number;
  slug: string;
  sortOrder: number;
};

export type AdminCategory = {
  archivedAt: string | null;
  description: string;
  iconAttachmentId: number | null;
  iconUrl: string | null;
  id: number;
  isActive: boolean;
  name: string;
  productCount: { published: number; total: number };
  seoDescription: string;
  seoTitle: string;
  slug: string;
  sortOrder: number;
  subcategories: AdminSubcategory[];
};

export type AdminTaxonomySnapshot = {
  categories: AdminCategory[];
  collections: string[];
  issues: string[];
  version: number;
};

export type ProductTaxonomy = {
  category: { id: number; name: string; slug: string } | null;
  collections: string[];
  productId: number;
  subcategories: { facet: string; id: number; name: string; slug: string }[];
};

export type CategoryIntegrityReport = {
  crossCategorySubcategory: unknown[];
  danglingCategory: number[];
  danglingSubcategory: number[];
  inactiveWithProducts: { category_id: number; name: string; published: number }[];
  isClean: boolean;
  publishedWithoutCategory: number[];
  unknownCollections: string[];
};

const ADMIN_TAXONOMY_TAG = "admin-taxonomy";

export class WpTaxonomyError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "WpTaxonomyError";
    this.code = code;
    this.status = status;
  }
}

export function taxonomyErrorResponse(error: unknown, fallback: string) {
  if (error instanceof WpTaxonomyError) {
    return { body: { code: error.code, message: error.message }, status: error.status };
  }

  return { body: { code: "papelito_internal_error", message: fallback }, status: 500 };
}

function authHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

/**
 * Não existe fallback de categoria hardcoded, de propósito.
 *
 * A lista antiga (`OFFICIAL_CATEGORY_KEYS`) descartava em silêncio qualquer
 * categoria fora dela — categoria nova ficava invisível no admin até alguém
 * editar TypeScript. Aqui, falha de origem vira `issues` visível na tela.
 */
export async function getAdminTaxonomySnapshot(
  accessToken?: string,
): Promise<AdminTaxonomySnapshot> {
  const result = await wpRest<{
    categories: AdminCategory[];
    collections: string[];
    version: number;
  }>("/papelito/v1/admin/categories", {
    headers: authHeaders(accessToken),
    tags: [ADMIN_TAXONOMY_TAG],
    revalidate: 0,
  });

  if (!result.ok) {
    return {
      categories: [],
      collections: [],
      issues: [`[taxonomia] ${result.error.message}`],
      version: 0,
    };
  }

  return {
    categories: Array.isArray(result.data.categories) ? result.data.categories : [],
    collections: Array.isArray(result.data.collections) ? result.data.collections : [],
    issues: [],
    version: Number(result.data.version) || 0,
  };
}

export async function getProductTaxonomy(
  accessToken: string | undefined,
  productId: number,
): Promise<ProductTaxonomy | null> {
  const result = await wpRest<ProductTaxonomy>(
    `/papelito/v1/admin/products/${productId}/taxonomy`,
    { headers: authHeaders(accessToken) },
  );

  return result.ok ? result.data : null;
}

export async function saveProductTaxonomy(
  accessToken: string | undefined,
  productId: number,
  payload: { categoryId?: number; collections?: string[]; subcategoryIds?: number[] },
) {
  const result = await wpRest<ProductTaxonomy>(
    `/papelito/v1/admin/products/${productId}/taxonomy`,
    { headers: authHeaders(accessToken), json: payload, method: "PUT" },
  );

  if (!result.ok) {
    throw new WpTaxonomyError(
      result.error.code,
      result.error.message,
      result.status || result.error.data?.status || 500,
    );
  }

  return result.data;
}

export async function getCategoryIntegrity(accessToken?: string) {
  const result = await wpRest<CategoryIntegrityReport>(
    "/papelito/v1/admin/categories/integrity",
    { headers: authHeaders(accessToken) },
  );

  return result.ok ? result.data : null;
}

type MutationInit = {
  json?: unknown;
  method: "DELETE" | "POST" | "PUT";
};

/**
 * O erro do WordPress precisa chegar tipado até a rota.
 *
 * Um `Error` cru faz `taxonomyErrorResponse()` cair no fallback e transformar
 * regra de negócio (409 de slug travado, 409 de subcategoria em uso, 404) num
 * 500 genérico — o painel passa a dizer "não foi possível salvar" sem motivo, e
 * a edição parece falhar sozinha.
 */
async function taxonomyMutation<T>(
  accessToken: string | undefined,
  path: string,
  init: MutationInit,
): Promise<T> {
  const result = await wpRest<T>(path, {
    headers: authHeaders(accessToken),
    json: init.json,
    method: init.method,
  });

  if (!result.ok) {
    throw new WpTaxonomyError(
      result.error.code,
      result.error.message,
      result.status || result.error.data?.status || 500,
    );
  }

  return result.data;
}

export function createCategory(accessToken: string | undefined, json: unknown) {
  return taxonomyMutation<AdminCategory>(accessToken, "/papelito/v1/admin/categories", {
    json,
    method: "POST",
  });
}

export function updateCategory(
  accessToken: string | undefined,
  categoryId: number,
  json: unknown,
) {
  return taxonomyMutation<AdminCategory>(
    accessToken,
    `/papelito/v1/admin/categories/${categoryId}`,
    { json, method: "PUT" },
  );
}

export function archiveCategory(accessToken: string | undefined, categoryId: number) {
  return taxonomyMutation<AdminCategory>(
    accessToken,
    `/papelito/v1/admin/categories/${categoryId}`,
    { method: "DELETE" },
  );
}

export function restoreCategory(accessToken: string | undefined, categoryId: number) {
  return taxonomyMutation<AdminCategory>(
    accessToken,
    `/papelito/v1/admin/categories/${categoryId}/restore`,
    { method: "POST" },
  );
}

export function reorderCategories(accessToken: string | undefined, ids: number[]) {
  return taxonomyMutation<{ categories: AdminCategory[] }>(
    accessToken,
    "/papelito/v1/admin/categories/reorder",
    { json: { ids }, method: "PUT" },
  );
}

export function createSubcategory(
  accessToken: string | undefined,
  categoryId: number,
  json: unknown,
) {
  return taxonomyMutation<AdminSubcategory>(
    accessToken,
    `/papelito/v1/admin/categories/${categoryId}/subcategories`,
    { json, method: "POST" },
  );
}

export function reorderSubcategories(
  accessToken: string | undefined,
  categoryId: number,
  ids: number[],
) {
  return taxonomyMutation<AdminSubcategory[]>(
    accessToken,
    `/papelito/v1/admin/categories/${categoryId}/subcategories/reorder`,
    { json: { ids }, method: "PUT" },
  );
}

export function updateSubcategory(
  accessToken: string | undefined,
  subcategoryId: number,
  json: unknown,
) {
  return taxonomyMutation<AdminSubcategory>(
    accessToken,
    `/papelito/v1/admin/subcategories/${subcategoryId}`,
    { json, method: "PUT" },
  );
}

export function archiveSubcategory(
  accessToken: string | undefined,
  subcategoryId: number,
) {
  return taxonomyMutation<AdminSubcategory>(
    accessToken,
    `/papelito/v1/admin/subcategories/${subcategoryId}`,
    { method: "DELETE" },
  );
}

export type ProductTaxonomyMap = Record<
  string,
  {
    category: { id: number; name: string; slug: string } | null;
    collections: string[];
    productId: number;
    subcategories: { facet: string; id: number; name: string; slug: string }[];
  }
>;

/**
 * Taxonomia de vários produtos numa requisição.
 *
 * A lista do admin traz 20 produtos por página; pedir um a um seria N+1 na tela
 * mais usada do painel.
 */
export async function getProductsTaxonomyMap(
  accessToken: string | undefined,
  productIds: number[],
): Promise<ProductTaxonomyMap> {
  const ids = Array.from(new Set(productIds.filter((id) => Number.isInteger(id) && id > 0)));

  if (ids.length === 0) {
    return {};
  }

  const result = await wpRest<{ items: ProductTaxonomyMap }>(
    `/papelito/v1/admin/products/taxonomy?productIds=${ids.join(",")}`,
    { headers: authHeaders(accessToken) },
  );

  return result.ok && result.data.items ? result.data.items : {};
}
