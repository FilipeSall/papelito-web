import { afterEach, describe, expect, it, vi } from "vitest";

import { getShippingQuote } from "./get-shipping-quote";

const input = {
  vendorId: 101,
  destinationCep: "01310930",
  items: [{ productId: 17, qty: 2 }],
};

function quoteResponse(options: unknown[]) {
  return {
    origin_cep: "01001000",
    destination_cep: "01310930",
    vendor_id: 101,
    options,
  };
}

function mockQuote(payload: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => payload }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getShippingQuote", () => {
  it.each([
    { code: "!!!" },
    { code: "EXPRESSO" },
    { code: "exp resso" },
    { code: "exp:resso" },
    { code: " expresso " },
    { code: "03298", service_code: "03220" },
    { code: "03298", option_key: "" },
  ])("rejects a noncanonical or conflicting service identity: %j", async (identity) => {
    mockQuote(quoteResponse([{ service: "PAC", name: "PAC", price: 15.88, delivery_time: 5, ...identity }]));

    await expect(getShippingQuote(input)).rejects.toThrow("Resposta de frete inválida.");
  });

  it.each([
    { price: -15.88, delivery_time: 5 },
    { price: 15.88, delivery_time: -1 },
    { price: 15.88, delivery_time: 2.5 },
    { price: 15.88, delivery_time: "invalid" },
  ])("rejects invalid legacy money or delivery time: %j", async (values) => {
    mockQuote(quoteResponse([{ service: "PAC", code: "03298", name: "PAC", ...values }]));

    await expect(getShippingQuote(input)).rejects.toThrow("Resposta de frete inválida.");
  });

  it("maps a normalized provider-aware option without losing the legacy fields", async () => {
    mockQuote(
      quoteResponse([
        {
          provider: "correios",
          option_key: "correios:03298",
          service: "PAC",
          service_code: "03298",
          name: "PAC",
          price: 15.88,
          customer_price_cents: 1588,
          delivery_time: 5,
          carrier_cost_cents: 1200,
          quoted_at: "2026-09-15T12:00:00Z",
          expires_at: "2026-09-15T15:00:00Z",
          external_quote_id: "quote-123",
          fingerprint: "quote-fingerprint",
        },
      ]),
    );

    await expect(getShippingQuote(input)).resolves.toMatchObject({
      options: [
        {
          provider: "correios",
          optionKey: "correios:03298",
          serviceCode: "03298",
          service: "PAC",
          code: "03298",
          name: "PAC",
          price: 15.88,
          customerPriceCents: 1588,
          deliveryTime: 5,
          carrierCostCents: 1200,
          quotedAt: "2026-09-15T12:00:00Z",
          expiresAt: "2026-09-15T15:00:00Z",
          externalQuoteId: "quote-123",
        },
      ],
    });
  });

  it("infers Correios and a namespaced key from a legacy-only option", async () => {
    mockQuote(
      quoteResponse([
        { service: "PAC", code: "03298", name: "PAC", price: 15.88, delivery_time: 5 },
      ]),
    );

    await expect(getShippingQuote(input)).resolves.toMatchObject({
      options: [{ provider: "correios", optionKey: "correios:03298", serviceCode: "03298" }],
    });
  });

  it("preserves a null delivery time instead of coercing it to zero", async () => {
    mockQuote(
      quoteResponse([
        { service: "PAC", code: "03298", name: "PAC", price: 15.88, delivery_time: null },
      ]),
    );

    await expect(getShippingQuote(input)).resolves.toMatchObject({
      options: [{ deliveryTime: null }],
    });
  });

  it("rejects a malformed null price instead of mapping it as free shipping", async () => {
    mockQuote(
      quoteResponse([
        { service: "PAC", code: "03298", name: "PAC", price: null, delivery_time: 5 },
      ]),
    );

    await expect(getShippingQuote(input)).rejects.toThrow("Resposta de frete inválida.");
  });

  it("rejects an explicit Braspress option without its normalized option key", async () => {
    mockQuote(
      quoteResponse([
        {
          provider: "braspress",
          service: "Rodoviario",
          service_code: "R",
          name: "Rodoviário",
          price: 15.88,
          delivery_time: 5,
        },
      ]),
    );

    await expect(getShippingQuote(input)).rejects.toThrow("Resposta de frete inválida.");
  });

  it("rejects a response whose only option names an unknown provider", async () => {
    mockQuote(
      quoteResponse([
        {
          provider: "unknown-carrier",
          service: "PAC",
          code: "03298",
          name: "PAC",
          price: 15.88,
          delivery_time: 5,
        },
      ]),
    );

    await expect(getShippingQuote(input)).rejects.toThrow("Resposta de frete inválida.");
  });

  it("keeps a healthy Correios option renderable when another provider is omitted", async () => {
    mockQuote(
      quoteResponse([
        {
          provider: "unknown-carrier",
          service: "Express",
          code: "EXP",
          name: "Express",
          price: 25,
          delivery_time: 1,
        },
        {
          provider: "correios",
          option_key: "correios:03298",
          service: "PAC",
          service_code: "03298",
          name: "PAC",
          price: 15.88,
          customer_price_cents: 1588,
          delivery_time: 5,
        },
      ]),
    );

    const result = await getShippingQuote(input);

    expect(result.options).toEqual([
      expect.objectContaining({ provider: "correios" }),
    ]);
  });
});
