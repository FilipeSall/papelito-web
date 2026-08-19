import { describe, expect, it } from "vitest";

import type { ProductsCatalogSubcategory } from "../types/products-catalog";
import {
  groupSubcategoriesByFacet,
  keepSelectedCategories,
  parseScopedSubcategories,
  replaceCategorySubcategories,
  resolveCheckedSubcategories,
  subcategoriesOfCategory,
  toggleSubcategorySelection,
} from "./subcategory-selection";

const SEDAS: ProductsCatalogSubcategory[] = [
  { facet: "material", name: "Tradicional", slug: "tradicional" },
  { facet: "material", name: "Brown", slug: "brown" },
  { facet: "formato", name: "Slim", slug: "slim" },
  { facet: "formato", name: "King Size", slug: "king-size" },
];

const PITEIRAS: ProductsCatalogSubcategory[] = [
  { facet: "tamanho", name: "Slim", slug: "slim" },
  { facet: "tamanho", name: "Mega Longa", slug: "mega-longa" },
];

describe("groupSubcategoriesByFacet", () => {
  it("agrupa preservando a ordem da taxonomia", () => {
    expect(groupSubcategoriesByFacet(SEDAS)).toEqual([
      { facet: "material", items: [SEDAS[0], SEDAS[1]] },
      { facet: "formato", items: [SEDAS[2], SEDAS[3]] },
    ]);
  });

  it("cai em `geral` quando a faceta vem vazia", () => {
    expect(
      groupSubcategoriesByFacet([{ facet: "", name: "Solta", slug: "solta" }]),
    ).toEqual([{ facet: "geral", items: [{ facet: "", name: "Solta", slug: "solta" }] }]);
  });

  it("categoria sem subcategoria não gera grupo", () => {
    expect(groupSubcategoriesByFacet([])).toEqual([]);
  });
});

describe("resolveCheckedSubcategories", () => {
  it("sem nada na URL, tudo aparece marcado", () => {
    expect([...resolveCheckedSubcategories(SEDAS, [])]).toEqual([
      "tradicional",
      "brown",
      "slim",
      "king-size",
    ]);
  });

  it("faceta pedida em parte marca só o que foi pedido", () => {
    expect([...resolveCheckedSubcategories(SEDAS, ["brown"])]).toEqual([
      "brown",
      // `formato` não foi restringido, então continua inteiro marcado.
      "slim",
      "king-size",
    ]);
  });

  it("restringe cada faceta de forma independente", () => {
    expect([...resolveCheckedSubcategories(SEDAS, ["brown", "slim"])]).toEqual([
      "brown",
      "slim",
    ]);
  });

  it("ignora slug que não pertence à categoria", () => {
    expect([...resolveCheckedSubcategories(PITEIRAS, ["brown"])]).toEqual([
      "slim",
      "mega-longa",
    ]);
  });
});

describe("toggleSubcategorySelection", () => {
  it("desmarcar um item emite o resto da faceta", () => {
    expect(toggleSubcategorySelection(SEDAS, [], "brown")).toEqual(["tradicional"]);
  });

  it("desmarcar em duas facetas mantém as duas restrições", () => {
    const semBrown = toggleSubcategorySelection(SEDAS, [], "brown");
    expect(toggleSubcategorySelection(SEDAS, semBrown, "slim")).toEqual([
      "tradicional",
      "king-size",
    ]);
  });

  it("remarcar devolve a faceta ao estado sem filtro", () => {
    const semBrown = toggleSubcategorySelection(SEDAS, [], "brown");
    expect(toggleSubcategorySelection(SEDAS, semBrown, "brown")).toEqual([]);
  });

  /**
   * Faceta cheia sai da URL de propósito: emitir os quatro slugs excluiria o produto
   * que não tem nenhuma subcategoria daquela faceta, e "tudo marcado" deixaria de
   * significar "a categoria inteira".
   */
  it("faceta cheia nunca vai para a URL", () => {
    expect(toggleSubcategorySelection(SEDAS, ["brown"], "tradicional")).toEqual([]);
  });

  it("desmarcar o último item da faceta zera a restrição daquela faceta", () => {
    const soBrown = ["brown"];
    expect(toggleSubcategorySelection(SEDAS, soBrown, "brown")).toEqual([]);
  });

  it("desmarcar o último item de uma faceta preserva a restrição da outra", () => {
    expect(toggleSubcategorySelection(SEDAS, ["brown", "slim"], "brown")).toEqual(["slim"]);
  });

  it("emite os slugs na ordem da taxonomia, não na ordem do clique", () => {
    const semSlim = toggleSubcategorySelection(SEDAS, [], "slim");
    expect(toggleSubcategorySelection(SEDAS, semSlim, "tradicional")).toEqual([
      "brown",
      "king-size",
    ]);
  });
});

describe("escopo por categoria", () => {
  it("separa `categoria.subcategoria` do slug solto", () => {
    const scoped = parseScopedSubcategories([
      "sedas.brown",
      "sedas.slim",
      "piteiras.mega-longa",
      "avulso",
    ]);

    expect([...scoped.byCategory]).toEqual([
      ["sedas", ["brown", "slim"]],
      ["piteiras", ["mega-longa"]],
    ]);
    expect(scoped.bare).toEqual(["avulso"]);
  });

  /**
   * Descartar em silêncio transformaria filtro quebrado em filtro ausente: a
   * listagem devolveria a categoria inteira em vez de cair fechada.
   */
  it("marca como inválido o escopo sem categoria ou sem slug", () => {
    const scoped = parseScopedSubcategories(["sedas.", ".brown"]);

    expect(scoped.byCategory.size).toBe(0);
    expect(scoped.bare).toEqual([]);
    expect(scoped.invalid).toBe(true);
  });

  it("escopo bem formado não marca o pedido como inválido", () => {
    expect(parseScopedSubcategories(["sedas.brown", "avulso"]).invalid).toBe(false);
  });

  it("lê os slugs de uma categoria pelo escopo dela", () => {
    const scoped = parseScopedSubcategories(["sedas.brown", "piteiras.slim"]);

    expect(subcategoriesOfCategory(scoped, "sedas", SEDAS)).toEqual(["brown"]);
    expect(subcategoriesOfCategory(scoped, "piteiras", PITEIRAS)).toEqual(["slim"]);
  });

  it("slug solto vale para a categoria que o tem", () => {
    const scoped = parseScopedSubcategories(["brown"]);

    expect(subcategoriesOfCategory(scoped, "sedas", SEDAS)).toEqual(["brown"]);
    expect(subcategoriesOfCategory(scoped, "piteiras", PITEIRAS)).toEqual([]);
  });

  it("trocar o refinamento de uma categoria preserva o das outras", () => {
    expect(
      replaceCategorySubcategories(
        ["sedas.brown", "piteiras.slim"],
        "sedas",
        ["tradicional"],
        SEDAS,
      ),
    ).toEqual(["piteiras.slim", "sedas.tradicional"]);
  });

  it("esvaziar o refinamento de uma categoria não mexe nas outras", () => {
    expect(
      replaceCategorySubcategories(["sedas.brown", "piteiras.slim"], "sedas", [], SEDAS),
    ).toEqual(["piteiras.slim"]);
  });

  it("o slug solto da categoria editada é absorvido pelo escopo novo", () => {
    expect(
      replaceCategorySubcategories(["brown"], "sedas", ["tradicional"], SEDAS),
    ).toEqual(["sedas.tradicional"]);
  });

  it("categoria que saiu da seleção leva junto o refinamento dela", () => {
    expect(
      keepSelectedCategories(["sedas.brown", "piteiras.slim"], ["piteiras"]),
    ).toEqual(["piteiras.slim"]);
  });

  it("sem categoria selecionada não sobra refinamento nenhum", () => {
    expect(keepSelectedCategories(["sedas.brown"], [])).toEqual([]);
  });
});

