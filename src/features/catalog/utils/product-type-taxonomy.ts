import type { ProductTypeId } from "../types/products-catalog";

export type SpecificProductTypeId = Exclude<ProductTypeId, "todos">;

export const SPECIFIC_PRODUCT_TYPES: readonly SpecificProductTypeId[] = [
  "sedas",
  "piteiras",
  "filtros",
  "acessorios",
];

/**
 * Nomes e slugs aceitos para cada categoria raiz do `product_cat`.
 *
 * Os ids da UI nunca foram slugs do WordPress: as gerações de import do catálogo
 * criaram as raízes como `seda`/`piteira`/`filtro` e depois `papel`/`piteiras`/`filtro`.
 * O mapa é a única fonte de verdade dessa tradução — sem ele, a classificação vira
 * heurística por substring e categorias novas caem na categoria errada.
 */
const ROOT_CATEGORY_ALIASES: Record<SpecificProductTypeId, readonly string[]> = {
  sedas: ["sedas", "seda", "papel", "papeis", "papel de fumo", "papeis de fumo"],
  piteiras: ["piteiras", "piteira"],
  filtros: ["filtros", "filtro"],
  acessorios: ["acessorios", "acessorio"],
};

const QUERY_PARAM_ALIASES: Record<SpecificProductTypeId, readonly string[]> = {
  sedas: ["sedas", "seda"],
  piteiras: ["piteiras", "piteira"],
  filtros: ["filtros", "filtro"],
  acessorios: ["acessorios", "acessorio"],
};

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

function buildLookup(source: Record<SpecificProductTypeId, readonly string[]>) {
  const lookup = new Map<string, SpecificProductTypeId>();

  for (const type of SPECIFIC_PRODUCT_TYPES) {
    for (const alias of source[type]) {
      lookup.set(normalizeTaxonomyText(alias), type);
    }
  }

  return lookup;
}

const ROOT_LOOKUP = buildLookup(ROOT_CATEGORY_ALIASES);
const QUERY_PARAM_LOOKUP = buildLookup(QUERY_PARAM_ALIASES);

/**
 * Traduz uma categoria raiz do WordPress para o tipo exibido na UI.
 *
 * Retorna `null` quando a raiz não está mapeada — o produto fica visível apenas em TODOS,
 * nunca é absorvido por outra categoria.
 */
export function resolveRootProductType(
  name: string | null | undefined,
  slug: string | null | undefined,
): SpecificProductTypeId | null {
  return (
    ROOT_LOOKUP.get(normalizeTaxonomyText(name)) ??
    ROOT_LOOKUP.get(normalizeTaxonomyText(slug)) ??
    null
  );
}

export function readSingleQueryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

/**
 * Lê `?tipo=`. Valor ausente, desconhecido ou inválido cai em `todos`.
 */
export function normalizeProductTypeParam(
  value: string | string[] | undefined,
): ProductTypeId {
  const raw = normalizeTaxonomyText(readSingleQueryParam(value));

  if (!raw) {
    return "todos";
  }

  if (raw === "todos" || raw === "todas" || raw === "tudo") {
    return "todos";
  }

  return QUERY_PARAM_LOOKUP.get(raw) ?? "todos";
}

/**
 * Lê `?tipos=` (lista separada por vírgula). Entradas inválidas são descartadas.
 */
export function normalizeSelectedTypesParam(
  value: string | string[] | undefined,
): SpecificProductTypeId[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const resolved = raw
    .flatMap((part) => part.split(","))
    .map((part) => QUERY_PARAM_LOOKUP.get(normalizeTaxonomyText(part)))
    .filter((part): part is SpecificProductTypeId => Boolean(part));

  return Array.from(new Set(resolved));
}

/**
 * Combina `?tipos=` (plural, aditivo) com `?tipo=` (singular, exclusivo).
 */
export function resolveSelectedTypesFromParams(params: {
  tipo?: string | string[];
  tipos?: string | string[];
}) {
  const queryType = normalizeProductTypeParam(params.tipo);
  const querySelectedTypes = normalizeSelectedTypesParam(params.tipos);

  const selectedTypes =
    querySelectedTypes.length > 0
      ? querySelectedTypes
      : queryType !== "todos"
        ? [queryType as SpecificProductTypeId]
        : [];

  return { queryType, selectedTypes };
}
