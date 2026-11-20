import { describe, expect, it } from "vitest";

import { buildEventContext, LOOSE_PRODUCT_ID } from "../test/fixtures";
import { baseCentsOf, firstDiscountCents, kitUnitCents, levelFor, previewPricing, unitsOf } from "./pricing-preview";

const ctx = buildEventContext();

describe("previewPricing", () => {
  it("kit dos preços de 29/10 custa 655,95", () => {
    expect(kitUnitCents([18020, 19195, 19195, 20760])).toBe(65595);
  });

  it("kit conta como 4 unidades", () => {
    expect(unitsOf({ 1: 6 }, 1)).toBe(10);
  });

  it("base da faixa é o pedido cheio, com o kit pelo preço sem desconto", () => {
    expect(baseCentsOf(ctx, { [LOOSE_PRODUCT_ID]: 14 }, 2)).toBe(156268 + 2 * 77170);
  });

  it.each([
    [0, "lojista"],
    [99999, "lojista"],
    [100000, "parceiro"],
    [149999, "parceiro"],
    [150000, "lenda"],
    [500000, "lenda"],
  ])("base de %i centavos é %s", (base, key) => {
    expect(levelFor(ctx.levels, base).key).toBe(key);
  });

  it("kit e brinde entram no primeiro degrau com desconto", () => {
    expect(firstDiscountCents(ctx.levels)).toBe(100000);
  });

  it("arredonda o desconto por linha", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 3, 101: 17 }, 0);

    expect(preview.baseCents).toBe(339826);
    expect(preview.level.key).toBe("lenda");
    expect(preview.lines.find((line) => line.productId === LOOSE_PRODUCT_ID)).toMatchObject({ subtotalCents: 33486, discountCents: 3349, totalCents: 30137 });
    expect(preview.discountCents).toBe(3349 + 30634);
  });

  it("não aplica o nível ao kit", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 14 }, 2);

    expect(preview.units).toBe(22);
    expect(preview.kit.totalCents).toBe(2 * 65595);
    expect(preview.kitSavingsCents).toBe(2 * (77170 - 65595));
    expect(preview.itemsCents).toBe(156268 - 15627 + 2 * 65595);
  });

  it("diz quanto falta em dinheiro para o próximo nível", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 13 }, 0);

    expect(preview.nextLevel?.key).toBe("lenda");
    expect(preview.centsToNext).toBe(150000 - 145106);
    expect(previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 45 }, 0).nextLevel).toBeNull();
  });

  it("ignora quantidade zero e produto desconhecido", () => {
    const preview = previewPricing(ctx, { [LOOSE_PRODUCT_ID]: 0, 999: 3 }, 0);

    expect(preview.lines).toEqual([]);
    expect(preview.units).toBe(0);
    expect(preview.baseCents).toBe(0);
  });
});
