import { describe, expect, it } from "vitest";

import { buildEventContext, LOOSE_PRODUCT_ID } from "../test/fixtures";
import { kitUnitCents, levelFor, previewPricing, unitsOf } from "./pricing-preview";

const ctx = buildEventContext();

describe("previewPricing", () => {
  it("kit dos preços de 29/10 custa 655,95", () => {
    expect(kitUnitCents([18020, 19195, 19195, 20760])).toBe(65595);
  });

  it("kit conta como 4 unidades", () => {
    expect(unitsOf({ 1: 6 }, 1)).toBe(10);
  });

  it.each([
    [0, "lojista"],
    [9, "lojista"],
    [10, "parceiro"],
    [19, "parceiro"],
    [20, "pdv_perfeito"],
    [40, "lenda"],
  ])("%i unidades é %s", (units, key) => {
    expect(levelFor(ctx.levels, units).key).toBe(key);
  });

  it("arredonda o desconto por linha", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 3, 101: 17 }, 0);

    expect(preview.level.key).toBe("pdv_perfeito");
    expect(preview.lines.find((line) => line.productId === LOOSE_PRODUCT_ID)).toMatchObject({ subtotalCents: 33486, discountCents: 2679, totalCents: 30807 });
    expect(preview.discountCents).toBe(2679 + 24507);
  });

  it("não aplica o nível ao kit", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 14 }, 2);

    expect(preview.units).toBe(22);
    expect(preview.kit.totalCents).toBe(2 * 65595);
    expect(preview.kitSavingsCents).toBe(2 * (77170 - 65595));
    expect(preview.itemsCents).toBe(156268 - 12501 + 2 * 65595);
  });

  it("diz quantas unidades faltam para o próximo nível", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 13 }, 0);

    expect(preview.nextLevel?.key).toBe("pdv_perfeito");
    expect(preview.unitsToNext).toBe(7);
    expect(previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 45 }, 0).nextLevel).toBeNull();
  });

  it("ignora quantidade zero e produto desconhecido", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 0, 999: 3 }, 0);

    expect(preview.lines).toEqual([]);
    expect(preview.units).toBe(0);
  });
});
