import { describe, expect, it } from "vitest";

import { useCheckoutStore } from "./use-checkout-store";

describe("useCheckoutStore", () => {
  it("migrates legacy selectedShippingQuote into the new shippingQuote shape", async () => {
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
      selectedOption: {
        code: "sedex",
        name: "SEDEX",
        service: "sedex",
        price: 12.5,
        deliveryTime: 2,
      },
    });
    expect(useCheckoutStore.getState().paymentForm).toEqual({
      holderName: "",
      installments: "",
      cardTokenId: "tok_123",
      cardLast4: "1111",
    });
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
