import { describe, expect, it } from "vitest";

import { useCheckoutStore } from "./use-checkout-store";

describe("useCheckoutStore", () => {
  it("migrates the legacy selectedShippingQuote key and drops a selection that predates the multicarrier contract", async () => {
    window.localStorage.setItem(
      "papelito-checkout-store",
      JSON.stringify({
        state: {
          addressForm: {
            zipCode: "",
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: "",
            state: "",
          },
          paymentMethod: "credit_card",
          paymentForm: {
            holderName: "",
            installments: "",
            cardTokenId: "tok_123",
            cardLast4: "1111",
          },
          selectedShippingQuote: {
            code: "sedex",
            name: "SEDEX",
            service: "sedex",
            price: 12.5,
            deliveryTime: 2,
          },
        },
        version: 1,
      }),
    );

    await useCheckoutStore.persist.rehydrate();

    expect(useCheckoutStore.getState().shippingQuote).toEqual({
      quote: null,
      selectedOption: null,
    });
    expect(useCheckoutStore.getState().paymentForm).toEqual({
      holderName: "",
      installments: "",
      cardTokenId: "tok_123",
      cardLast4: "1111",
    });
  });

  it("drops a persisted selection that cannot be revalidated against a fresh quote", async () => {
    window.localStorage.setItem(
      "papelito-checkout-store",
      JSON.stringify({
        state: {
          shippingQuote: {
            quote: null,
            selectedOption: {
              provider: "correios",
              optionKey: "correios:03298",
              serviceCode: "03298",
              code: "03298",
              service: "PAC",
              name: "PAC Contrato",
              price: 15.88,
              deliveryTime: 5,
            },
          },
        },
        version: 5,
      }),
    );

    await useCheckoutStore.persist.rehydrate();

    expect(useCheckoutStore.getState().shippingQuote.selectedOption).toBeNull();
  });

  it("keeps a persisted selection that carries the whole multicarrier snapshot", async () => {
    const selectedOption = {
      provider: "braspress",
      optionKey: "braspress:rodoviario",
      serviceCode: "rodoviario",
      code: "rodoviario",
      service: "Rodoviário",
      name: "Rodoviário",
      price: 34.1,
      deliveryTime: 3,
      customerPriceCents: 3410,
      fingerprint: "rodoviario-fingerprint",
      quotedAt: "2026-09-18T12:00:00Z",
      expiresAt: "2026-09-19T02:59:59.999Z",
    };

    window.localStorage.setItem(
      "papelito-checkout-store",
      JSON.stringify({
        state: { shippingQuote: { quote: null, selectedOption } },
        version: 5,
      }),
    );

    await useCheckoutStore.persist.rehydrate();

    expect(useCheckoutStore.getState().shippingQuote.selectedOption).toEqual(selectedOption);
  });

  it("resets checkout state to defaults", () => {
    const initialAttemptId = useCheckoutStore.getState().checkoutAttemptId;
    useCheckoutStore.getState().setAddressField("city", "Campinas");
    useCheckoutStore.getState().setPaymentMethod("pix");
    useCheckoutStore.getState().setPaymentField("holderName", "Maria");

    useCheckoutStore.getState().resetCheckout();

    expect(useCheckoutStore.getState()).toMatchObject({
      addressForm: {
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
      paymentMethod: "credit_card",
      paymentForm: {
        holderName: "",
        installments: "",
        cardTokenId: "",
        cardLast4: "",
      },
    });
    expect(useCheckoutStore.getState().checkoutAttemptId).toBeTruthy();
    expect(useCheckoutStore.getState().checkoutAttemptId).not.toBe(
      initialAttemptId,
    );
  });

  it("rotates the checkout attempt id without clearing the cart form", () => {
    useCheckoutStore.getState().setAddressField("city", "Campinas");
    const initialAttemptId = useCheckoutStore.getState().checkoutAttemptId;

    useCheckoutStore.getState().rotateCheckoutAttempt();

    expect(useCheckoutStore.getState().checkoutAttemptId).toBeTruthy();
    expect(useCheckoutStore.getState().checkoutAttemptId).not.toBe(
      initialAttemptId,
    );
    expect(useCheckoutStore.getState().addressForm.city).toBe("Campinas");
  });

  it("keeps an attempt for the same payload and rotates it when the payload changes", () => {
    const firstAttemptId = useCheckoutStore
      .getState()
      .syncCheckoutAttempt("cart-v1");
    const sameAttemptId = useCheckoutStore
      .getState()
      .syncCheckoutAttempt("cart-v1");
    const changedAttemptId = useCheckoutStore
      .getState()
      .syncCheckoutAttempt("cart-v2");

    expect(sameAttemptId).toBe(firstAttemptId);
    expect(changedAttemptId).not.toBe(firstAttemptId);
    expect(useCheckoutStore.getState().checkoutAttemptFingerprint).toBe("cart-v2");
  });

  it("keeps a card billing address independent from the delivery address", () => {
    useCheckoutStore.getState().setAddressField("city", "Sao Paulo");
    useCheckoutStore.getState().setUseDeliveryAddressForBilling(false);
    useCheckoutStore.getState().setBillingAddressField("city", "Campinas");

    expect(useCheckoutStore.getState().addressForm.city).toBe("Sao Paulo");
    expect(useCheckoutStore.getState().billingAddressForm.city).toBe(
      "Campinas",
    );
    expect(useCheckoutStore.getState().useDeliveryAddressForBilling).toBe(
      false,
    );
  });

  it("persists only non-sensitive payment fields", async () => {
    useCheckoutStore.getState().patchPaymentForm({
      holderName: "Maria",
      installments: "3x sem juros",
      cardTokenId: "tok_live",
      cardLast4: "4242",
    });

    await useCheckoutStore.persist.rehydrate();

    const raw = window.localStorage.getItem("papelito-checkout-store") || "";

    expect(raw).toContain("tok_live");
    expect(raw).toContain("checkoutAttemptId");
    expect(raw).not.toContain("4111111111111111");
    expect(raw).not.toContain('"cvv"');
  });
});
