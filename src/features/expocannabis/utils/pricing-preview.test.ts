import { describe, expect, it } from "vitest";

import { buildEventContext, LOOSE_PRODUCT_ID } from "../test/fixtures";
import { baseCentsOf, kitMinCents, kitUnitCents, levelFor, previewPricing, unitsOf } from "./pricing-preview";

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
    [99999, "lojista"],
    [100000, "parceiro"],
    [149999, "parceiro"],
    [150000, "lenda"],
  ])("base de %i centavos é %s", (baseCents, key) => {
    expect(levelFor(ctx.levels, baseCents).key).toBe(key);
  });

  it("base soma avulsos pelo preço do estande e kits pelo preço cheio", () => {
    expect(baseCentsOf(ctx, { [LOOSE_PRODUCT_ID]: 2, 999: 5 }, 1)).toBe(2 * 11162 + 77170);
  });

  it("kit e brinde entram no primeiro nível com desconto", () => {
    expect(kitMinCents(ctx.levels)).toBe(100000);
  });

  it("escolhe o nível pelo valor, não pela quantidade", () => {
    expect(previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 8 }, 0).level.key).toBe("lojista");
    expect(previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 9 }, 0).level.key).toBe("parceiro");
  });

  it("arredonda o desconto por linha", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 3, 101: 17 }, 0);

    expect(preview.level.key).toBe("lenda");
    expect(preview.lines.find((line) => line.productId === LOOSE_PRODUCT_ID)).toMatchObject({ subtotalCents: 33486, discountCents: 3349, totalCents: 30137 });
    expect(preview.discountCents).toBe(3349 + 30634);
  });

  it("não aplica o nível ao kit, mas conta o kit na base", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 14 }, 2);

    expect(preview.units).toBe(22);
    expect(preview.baseCents).toBe(156268 + 2 * 77170);
    expect(preview.kit.totalCents).toBe(2 * 65595);
    expect(preview.kitSavingsCents).toBe(2 * (77170 - 65595));
    expect(preview.itemsCents).toBe(156268 - 15627 + 2 * 65595);
  });

  it("diz quanto falta, em centavos, para o próximo nível", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 8 }, 0);

    expect(preview.nextLevel?.key).toBe("parceiro");
    expect(preview.centsToNext).toBe(100000 - 89296);
    expect(previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 14 }, 0).nextLevel).toBeNull();
  });

  it("ignora quantidade zero e produto desconhecido", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 0, 999: 3 }, 0);

    expect(preview.lines).toEqual([]);
    expect(preview.units).toBe(0);
  });
});
