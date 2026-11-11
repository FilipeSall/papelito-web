import { describe, expect, it } from "vitest";

import { buildEventContext } from "../test/fixtures";
import { parseEventContext } from "./parse-context";
import { parseOrderStatus } from "./parse-order-status";
import { parseQuote } from "./parse-quote";

function wpContext() {
  const ctx = buildEventContext();
  return {
    ...ctx,
    shelves: { mais_vendidos: ctx.shelves.maisVendidos, premium: ctx.shelves.premium, lancamentos: ctx.shelves.lancamentos },
  };
}

const wpQuote = {
  units: 22,
  level: { key: "pdv_perfeito", name: "PDV Perfeito", minUnits: 20, pctBp: 800 },
  lines: [{ product_id: 200, qty: 14, unit_cents: 11162, subtotal_cents: 156268, discount_cents: 12501, total_cents: 143767, source: "event_level" }],
  kit: { qty: 1, unit_cents: 65595, full_unit_cents: 77170, total_cents: 65595 },
  kitComponents: [],
  itemsCents: 209362,
  discountCents: 12501,
  kitSavingsCents: 11575,
  shipping: { optionKey: "correios:pac", name: "PAC", priceCents: 2990, deliveryTime: 5, fingerprint: "fp" },
  totalCents: 212352,
  quoteFingerprint: "abc",
};

describe("parseEventContext", () => {
  it("lê o contexto do WordPress em camelCase", () => {
    const ctx = parseEventContext(wpContext());

    expect(ctx?.shelves.maisVendidos).toEqual([101, 102]);
    expect(ctx?.products).toHaveLength(6);
    expect(ctx?.kit.unitCents).toBe(65595);
  });

  it("recusa contexto sem campo obrigatório", () => {
    const { levels: _levels, ...semNiveis } = wpContext();

    expect(parseEventContext(semNiveis)).toBeNull();
    expect(parseEventContext({ ...wpContext(), products: [{ id: 1 }] })).toBeNull();
    expect(parseEventContext("lixo")).toBeNull();
  });
});

describe("parseQuote", () => {
  it("lê a cotação", () => {
    const quote = parseQuote(wpQuote);

    expect(quote?.lines[0]).toEqual({ productId: 200, qty: 14, unitCents: 11162, subtotalCents: 156268, discountCents: 12501, totalCents: 143767 });
    expect(quote?.kit.totalCents).toBe(65595);
    expect(quote?.shipping.priceCents).toBe(2990);
    expect(quote?.quoteFingerprint).toBe("abc");
  });

  it("recusa cotação sem total ou fingerprint", () => {
    expect(parseQuote({ ...wpQuote, totalCents: "212352" })).toBeNull();
    expect(parseQuote({ ...wpQuote, quoteFingerprint: "" })).toBeNull();
  });
});

describe("parseOrderStatus", () => {
  it("lê o status do pedido", () => {
    expect(parseOrderStatus({ orderId: 501, orderNumber: "501", state: "at_terminal", detail: "", totalCents: 100, method: "pix" })).toEqual({
      orderId: 501,
      orderNumber: "501",
      state: "at_terminal",
      detail: "",
      totalCents: 100,
      method: "pix",
    });
  });

  it("recusa estado desconhecido", () => {
    expect(parseOrderStatus({ state: "talvez", detail: "", totalCents: 1, method: "card" })).toBeNull();
  });
});
