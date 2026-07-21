import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "../../../../test/msw/server";
import type { CartItem } from "../types/cart";
import { getCartPricing } from "./get-cart-pricing";

const item: CartItem = {
  id: "11776",
  name: "Seda Slim King Size",
  price: 1.21,
  originalPrice: 121,
  quantity: 1,
  vendorId: 101,
  vendorName: "Vendor Centro",
  promotionContext: "signed-context",
};

describe("getCartPricing", () => {
  it("rejects non-numeric product IDs before calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await getCartPricing(
      [{ ...item, id: "produto-invalido" }],
      null,
    );

    expect(result).toEqual({
      ok: false,
      code: "papelito_checkout_invalid_items",
      message: "O carrinho contem um produto invalido.",
      status: 422,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.restoreAllMocks();
  });

  it("sends promotion context and accepts integer-cent authoritative totals", async () => {
    server.use(
      http.post("/api/cart/pricing", async ({ request }) => {
        const body = (await request.json()) as {
          items: Array<{ promotion_context?: string }>;
          shipping?: { destination_cep?: string; selected_code?: string };
        };
        expect(body.items[0]?.promotion_context).toBe("signed-context");
        expect(body.shipping).toEqual({
          destination_cep: "01310930",
          selected_code: "03298",
        });
        return HttpResponse.json({
          lines: [
            {
              productId: 11776,
              vendorId: 101,
              qty: 1,
              normalUnitCents: 9990,
              subtotalCents: 12100,
              discountCents: 11979,
              totalCents: 121,
              discountSource: "flash_sale",
              promotionContext: "signed-context",
            },
          ],
          coupon: null,
          adjustments: [],
          totals: {
            subtotalCents: 12100,
            discountCents: 11979,
            itemsCents: 121,
            shippingCents: 0,
            totalCents: 121,
          },
          paymentRestrictions: {
            creditCardMinimumCents: 100,
            pixMinimumCents: 1,
            boletoMinimumCents: 1,
            installmentMinimumCents: 100,
            maxInstallments: 1,
          },
        });
      }),
    );

    const result = await getCartPricing([item], null, {
      destinationCep: "01310930",
      selectedCode: "03298",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.quote.totals.totalCents).toBe(121);
      expect(result.quote.lines[0]?.discountSource).toBe("flash_sale");
    }
  });

  it("returns a clear recalculation error", async () => {
    server.use(
      http.post("/api/cart/pricing", () =>
        HttpResponse.json(
          { code: "papelito_checkout_insufficient_stock", message: "Estoque alterado." },
          { status: 409 },
        ),
      ),
    );

    await expect(getCartPricing([item], null)).resolves.toEqual({
      ok: false,
      code: "papelito_checkout_insufficient_stock",
      message: "Estoque alterado.",
      status: 409,
    });
  });

  it("rejects a pricing response whose line contract is incomplete", async () => {
    server.use(
      http.post("/api/cart/pricing", () =>
        HttpResponse.json({
          lines: [
            {
              productId: 11776,
              vendorId: 101,
              quantity: 1,
              totalCents: 121,
              source: "normal",
            },
          ],
          coupon: null,
          adjustments: [],
          totals: {
            subtotalCents: 121,
            discountCents: 0,
            itemsCents: 121,
            shippingCents: 0,
            totalCents: 121,
          },
          paymentRestrictions: {
            creditCardMinimumCents: 100,
            pixMinimumCents: 1,
            boletoMinimumCents: 1,
            installmentMinimumCents: 100,
            maxInstallments: 1,
          },
        }),
      ),
    );

    await expect(getCartPricing([item], null)).resolves.toEqual({
      ok: false,
      code: "papelito_invalid_response",
      message: "Resposta invalida ao recalcular o carrinho.",
      status: 200,
    });
  });
});
