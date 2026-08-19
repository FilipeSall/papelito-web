import type { ProductsCatalogSubcategory } from "../types/products-catalog";

export interface SubcategoryFacetGroup {
  facet: string;
  items: ProductsCatalogSubcategory[];
}

/**
 * Agrupa as subcategorias por faceta, preservando a ordem que a taxonomia mandou.
 *
 * A faceta não é enfeite: o filtro aplica OR dentro dela e AND entre facetas, então
 * `material=brown` + `formato=slim` é "brown E slim", enquanto `brown` + `hemp` é
 * "brown OU hemp".
 */
export function groupSubcategoriesByFacet(
  subcategories: readonly ProductsCatalogSubcategory[],
): SubcategoryFacetGroup[] {
  const groups = new Map<string, ProductsCatalogSubcategory[]>();

  for (const subcategory of subcategories) {
    const facet = subcategory.facet || "geral";
    const current = groups.get(facet);

    if (current) {
      current.push(subcategory);
    } else {
      groups.set(facet, [subcategory]);
    }
  }

  return Array.from(groups, ([facet, items]) => ({ facet, items }));
}

/**
 * Marcação derivada da URL: faceta sem nenhum slug pedido aparece inteira marcada.
 *
 * É o que sustenta "categoria recém-selecionada mostra tudo marcado e lista a
 * categoria inteira". Emitir os slugs de uma faceta cheia mudaria o resultado —
 * excluiria os produtos que não têm nenhuma subcategoria daquela faceta.
 */
export function resolveCheckedSubcategories(
  subcategories: readonly ProductsCatalogSubcategory[],
  selectedSlugs: readonly string[],
): Set<string> {
  const requested = new Set(selectedSlugs);
  const checked = new Set<string>();

  for (const group of groupSubcategoriesByFacet(subcategories)) {
    const constrained = group.items.filter((item) => requested.has(item.slug));
    const visible = constrained.length > 0 ? constrained : group.items;

    for (const item of visible) {
      checked.add(item.slug);
    }
  }

  return checked;
}

/**
 * Nova lista de `?subcategoria=` depois de ligar/desligar um item.
 *
 * Faceta que ficou cheia sai da URL — voltou a não restringir nada. É por isso que
 * desmarcar o último item de uma faceta reacende a faceta toda: sem nenhum item, a
 * faceta simplesmente parou de filtrar, e o estado "tudo desmarcado" nunca existe.
 */
export function toggleSubcategorySelection(
  subcategories: readonly ProductsCatalogSubcategory[],
  selectedSlugs: readonly string[],
  targetSlug: string,
): string[] {
  const checked = resolveCheckedSubcategories(subcategories, selectedSlugs);
  const emitted: string[] = [];

  for (const group of groupSubcategoriesByFacet(subcategories)) {
    const next = new Set(
      group.items.filter((item) => checked.has(item.slug)).map((item) => item.slug),
    );

    if (group.items.some((item) => item.slug === targetSlug)) {
      if (next.has(targetSlug)) {
        next.delete(targetSlug);
      } else {
        next.add(targetSlug);
      }
    }

    if (next.size > 0 && next.size < group.items.length) {
      emitted.push(
        ...group.items.filter((item) => next.has(item.slug)).map((item) => item.slug),
      );
    }
  }

  return emitted;
}

/**
 * Separador do escopo em `?subcategoria=`.
 *
 * `.` não é percent-encoded por `URLSearchParams` e nunca aparece num slug, então o
 * par continua legível na barra de endereço.
 */
export const SUBCATEGORY_SCOPE_SEPARATOR = ".";

export interface ScopedSubcategories {
  /** Slugs por categoria, para quem pediu `categoria.subcategoria`. */
  byCategory: Map<string, string[]>;
  /**
   * Slugs sem escopo, de links antigos.
   *
   * Mantidos separados porque a semântica é outra: o slug solto é resolvido dentro da
   * categoria de cada produto e, não resolvendo, exclui o produto — era o único
   * comportamento possível quando só uma categoria podia ser refinada.
   */
  bare: string[];
  /**
   * Houve token escopado com metade vazia (`sedas.`, `.brown`).
   *
   * Descartar em silêncio transformaria filtro quebrado em filtro ausente, e a
   * listagem devolveria a categoria inteira em vez de cair fechada.
   */
  invalid: boolean;
}

/**
 * Separa `?subcategoria=` em escopos de categoria.
 *
 * O slug é único dentro da categoria, não no catálogo: `slim` existe em Sedas,
 * Piteiras e Filtros. Sem o escopo, refinar uma categoria mexeria nas outras.
 */
export function parseScopedSubcategories(
  tokens: readonly string[],
): ScopedSubcategories {
  const byCategory = new Map<string, string[]>();
  const bare: string[] = [];
  let invalid = false;

  for (const token of tokens) {
    const separator = token.indexOf(SUBCATEGORY_SCOPE_SEPARATOR);

    if (separator < 0) {
      if (token && !bare.includes(token)) {
        bare.push(token);
      }
      continue;
    }

    const category = token.slice(0, separator);
    const slug = token.slice(separator + 1);

    if (!category || !slug) {
      invalid = true;
      continue;
    }

    const current = byCategory.get(category);

    if (!current) {
      byCategory.set(category, [slug]);
    } else if (!current.includes(slug)) {
      current.push(slug);
    }
  }

  return { byCategory, bare, invalid };
}

/**
 * Slugs marcados de uma categoria, já resolvendo o formato antigo sem escopo.
 */
export function subcategoriesOfCategory(
  scoped: ScopedSubcategories,
  categorySlug: string,
  available: readonly ProductsCatalogSubcategory[],
): string[] {
  const byCategory = scoped.byCategory.get(categorySlug);

  if (byCategory) {
    return byCategory;
  }

  const known = new Set(available.map((item) => item.slug));
  return scoped.bare.filter((slug) => known.has(slug));
}

/**
 * Monta `?subcategoria=` a partir dos slugs de UMA categoria, preservando o que as
 * outras categorias selecionadas já tinham.
 */
export function replaceCategorySubcategories(
  currentTokens: readonly string[],
  categorySlug: string,
  slugs: readonly string[],
  available: readonly ProductsCatalogSubcategory[],
): string[] {
  const scoped = parseScopedSubcategories(currentTokens);
  const known = new Set(available.map((item) => item.slug));
  const next: string[] = [];

  for (const [category, categorySlugs] of scoped.byCategory) {
    if (category === categorySlug) {
      continue;
    }

    next.push(
      ...categorySlugs.map(
        (slug) => `${category}${SUBCATEGORY_SCOPE_SEPARATOR}${slug}`,
      ),
    );
  }

  // Slug solto que pertence à categoria editada foi absorvido pelo escopo novo; o
  // que sobra é de outra categoria e continua valendo.
  next.push(...scoped.bare.filter((slug) => !known.has(slug)));
  next.push(
    ...slugs.map((slug) => `${categorySlug}${SUBCATEGORY_SCOPE_SEPARATOR}${slug}`),
  );

  return next;
}

/**
 * Descarta o que pertencia a categorias que saíram da seleção.
 */
export function keepSelectedCategories(
  tokens: readonly string[],
  selectedCategories: readonly string[],
): string[] {
  if (selectedCategories.length === 0) {
    return [];
  }

  const scoped = parseScopedSubcategories(tokens);
  const allowed = new Set(selectedCategories);
  const next: string[] = [];

  for (const [category, slugs] of scoped.byCategory) {
    if (!allowed.has(category)) {
      continue;
    }

    next.push(
      ...slugs.map((slug) => `${category}${SUBCATEGORY_SCOPE_SEPARATOR}${slug}`),
    );
  }

  return next;
}
