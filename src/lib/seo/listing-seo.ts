import {
  normalizeSubcategoryParam,
  readSingleQueryParam,
  resolveSelectedTypesFromParams,
} from "@/features/catalog/utils/product-type-taxonomy";

type QueryParamValue = string | string[] | undefined;

export interface ListingSearchParams {
  tipo?: QueryParamValue;
  tipos?: QueryParamValue;
  colecao?: QueryParamValue;
  subcategoria?: QueryParamValue;
  page?: QueryParamValue;
  view?: QueryParamValue;
  perPage?: QueryParamValue;
  precoMin?: QueryParamValue;
  precoMax?: QueryParamValue;
  busca?: QueryParamValue;
}

export interface ListingSeo {
  /** Caminho canônico, sempre relativo — quem monta o `Metadata` resolve para absoluto. */
  canonicalPath: string;
  noindex: boolean;
}

/**
 * Decide canonical e indexabilidade de uma página de listagem.
 *
 * O catálogo expressa filtro, ordenação, paginação e preferência de exibição **em query string**,
 * e o mesmo conjunto de produtos é alcançável por várias combinações (`?tipo=` e `?tipos=` são
 * equivalentes; `/novidades` equivale a `?colecao=novidades`). Sem canonical, cada combinação vira
 * uma URL concorrente da mesma página.
 *
 * As regras:
 *
 * - `view` e `perPage` são preferência de apresentação e nunca entram no canonical.
 * - Uma única categoria selecionada canonicaliza para a landing `/categorias/<slug>`, que é a
 *   página feita para ranquear aquela categoria.
 * - Busca livre e faixa de preço são espaço facetado ilimitado: `noindex, follow`, canonical na
 *   listagem limpa. `follow` é intencional — os produtos linkados continuam sendo descobertos.
 * - Paginação mantém canonical próprio e permanece indexável, para as páginas profundas terem
 *   caminho de rastreamento.
 */
export function resolveListingSeo(
  basePath: string,
  params: ListingSearchParams,
): ListingSeo {
  const search = readSingleQueryParam(params.busca)?.trim();
  const hasSearch = Boolean(search);
  const hasPriceRange =
    Boolean(readSingleQueryParam(params.precoMin)) || Boolean(readSingleQueryParam(params.precoMax));

  if (hasSearch || hasPriceRange) {
    return { canonicalPath: basePath, noindex: true };
  }

  const { selectedTypes } = resolveSelectedTypesFromParams(params);
  const subcategories = normalizeSubcategoryParam(params.subcategoria);

  if (subcategories.length > 0) {
    return { canonicalPath: basePath, noindex: true };
  }

  if (selectedTypes.length === 1) {
    return { canonicalPath: `/categorias/${selectedTypes[0]}`, noindex: true };
  }

  if (selectedTypes.length > 1) {
    return { canonicalPath: basePath, noindex: true };
  }

  const page = normalizePage(readSingleQueryParam(params.page));

  if (page > 1) {
    return { canonicalPath: `${basePath}?page=${page}`, noindex: false };
  }

  return { canonicalPath: basePath, noindex: false };
}

function normalizePage(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}
