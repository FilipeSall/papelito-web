import { afterEach, describe, expect, it } from "vitest";

import { pushEcommerceEvent } from "./data-layer";
import type { Ga4Item } from "./ga4-ecommerce";

const items: Ga4Item[] = [
  { item_id: "1", item_name: "Seda King Size", price: 10.5, quantity: 2 },
];

afterEach(() => {
  delete window.dataLayer;
});

describe("pushEcommerceEvent", () => {
  it("limpa o ecommerce anterior antes de publicar o novo evento", () => {
    pushEcommerceEvent("add_to_cart", items);

    expect(window.dataLayer).toEqual([
      { ecommerce: null },
      {
        event: "add_to_cart",
        ecommerce: {
          currency: "BRL",
          value: 21,
          items,
        },
      },
    ]);
  });

  it("preserva o que o GTM já tinha publicado no dataLayer", () => {
    window.dataLayer = [{ event: "gtm.js" }];

    pushEcommerceEvent("view_item", items);

    expect(window.dataLayer[0]).toEqual({ event: "gtm.js" });
    expect(window.dataLayer).toHaveLength(3);
  });

  it("não publica evento sem itens", () => {
    pushEcommerceEvent("begin_checkout", []);

    expect(window.dataLayer).toBeUndefined();
  });

  it("deriva o value dos itens em vez de aceitar um total de fora", () => {
    pushEcommerceEvent("begin_checkout", [
      { item_id: "1", item_name: "A", price: 10, quantity: 3 },
      { item_id: "2", item_name: "B", price: 0.5, quantity: 2 },
    ]);

    const [, event] = window.dataLayer!;

    expect((event.ecommerce as { value: number }).value).toBe(31);
  });
});
