import { describe, expect, it } from "vitest";

import { buildEventContext } from "../test/fixtures";
import { levelProgress } from "./level-progress";
import { ALL, buildProductTags, buildStoreCategories, gridProducts, gridTitle, productCountText } from "./store-catalog";

describe("store-catalog", () => {
  it("ordena Início, catálogo, Premium e Lançamentos, com foto de um produto", () => {
    const context = buildEventContext();
    const categories = buildStoreCategories(context);

    expect(categories.map((category) => category.label)).toEqual(["Início", "Sedas", "Premium", "Lançamentos"]);
    expect(categories[1].imageUrl).toBe("https://cdn.test/101.jpg");
    expect(categories[2].imageUrl).toBe("https://cdn.test/104.jpg");
  });

  it("Premium vale mais que Novo no selo", () => {
    const tags = buildProductTags(buildEventContext());

    expect(tags.get(104)).toBe("Premium");
    expect(tags.get(200)).toBeUndefined();
  });

  it("todos lista o catálogo inteiro e a busca vence a categoria", () => {
    const context = buildEventContext();
    const byId = new Map(context.products.map((product) => [product.id, product]));

    expect(gridProducts(context, byId, ALL, "")).toHaveLength(context.products.length);
    expect(gridProducts(context, byId, "premium", "avulso").map((product) => product.id)).toEqual([200]);
    expect(gridTitle(buildStoreCategories(context), "premium", "")).toBe("Linha Premium");
    expect(gridTitle(buildStoreCategories(context), "inicio", "pink")).toBe('Resultados pra "pink"');
  });

  it("conta produtos no singular e no plural", () => {
    expect(productCountText(1)).toBe("1 produto");
    expect(productCountText(8)).toBe("8 produtos");
  });

  it("levelProgress diz quanto falta e menciona o brinde só saindo de Lojista", () => {
    const levels = buildEventContext().levels;

    expect(levelProgress(levels, 7).short).toBe("Faltam 3 pra 5%");
    expect(levelProgress(levels, 7).long).toBe("Faltam 3 unidades pra Parceiro (5% off + brinde).");
    expect(levelProgress(levels, 12).long).toBe("Faltam 8 unidades pra PDV Perfeito (8% off).");
    expect(levelProgress(levels, 40).long).toBe("Você chegou no topo: 12% off em tudo.");
  });
});
