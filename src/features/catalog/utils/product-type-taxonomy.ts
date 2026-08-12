import type { ProductTypeId } from "../types/products-catalog";

export type SpecificProductTypeId = Exclude<ProductTypeId, "todos">;
type QueryParamValue = string | string[] | undefined;

export const SPECIFIC_PRODUCT_TYPES: readonly SpecificProductTypeId[] = [
  "sedas",
  "piteiras",
  "filtros",
  "acessorios",
];

export function normalizeTaxonomySlug(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  // Não tente "consertar" uma rota: removê-la transformaria `../../etc/passwd`
  // em um slug aparentemente legítimo.
  if (value.includes("/") || value.includes("\\")) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isTaxonomySlug(value: string): value is SpecificProductTypeId {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function normalizeTaxonomyText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function readSingleQueryParam(value: QueryParamValue) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

/**
 * Lê `?tipo=`. Categoria válida é resolvida contra a taxonomia no servidor;
 * aqui só validamos o formato para não manter uma lista estática no bundle.
 */
export function normalizeProductTypeParam(
  value: QueryParamValue,
): ProductTypeId {
  const raw = normalizeTaxonomySlug(readSingleQueryParam(value));

  if (!raw) {
    return "todos";
  }

  if (raw === "todos" || raw === "todas" || raw === "tudo") {
    return "todos";
  }

  return isTaxonomySlug(raw) ? raw : "todos";
}

/**
 * Lê `?tipos=` (lista separada por vírgula). Entradas inválidas são descartadas.
 */
export function normalizeSelectedTypesParam(
  value: QueryParamValue,
): SpecificProductTypeId[] {
  let raw: string[] = [];
  if (Array.isArray(value)) {
    raw = value;
  } else if (value) {
    raw = [value];
  }
  const resolved = raw
    .flatMap((part) => part.split(","))
    .map((part) => normalizeTaxonomySlug(part))
    .filter(isTaxonomySlug);

  return Array.from(new Set(resolved));
}

/**
 * Combina `?tipos=` (plural, aditivo) com `?tipo=` (singular, exclusivo).
 */
export function resolveSelectedTypesFromParams(params: {
  tipo?: QueryParamValue;
  tipos?: QueryParamValue;
}) {
  const queryType = normalizeProductTypeParam(params.tipo);
  const querySelectedTypes = normalizeSelectedTypesParam(params.tipos);

  let selectedTypes: SpecificProductTypeId[] = [];
  if (querySelectedTypes.length > 0) {
    selectedTypes = querySelectedTypes;
  } else if (queryType !== "todos") {
    selectedTypes = [queryType as SpecificProductTypeId];
  }

  return { queryType, selectedTypes };
}

/**
 * Le `?subcategoria=` (lista separada por virgula).
 *
 * Nao valida contra uma lista fixa: subcategoria vive no banco e nasce sem
 * deploy. Slug inexistente simplesmente nao casa com produto nenhum.
 */
export function normalizeSubcategoryParam(
  value: string | string[] | undefined,
): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const resolved = raw
    .flatMap((part) => part.split(","))
    .map((part) => normalizeTaxonomySlug(part))
    .filter(isTaxonomySlug);

  return Array.from(new Set(resolved));
}
