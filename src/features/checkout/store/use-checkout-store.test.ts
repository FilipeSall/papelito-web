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
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            installments: "",
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
  });

  it("resets checkout state to defaults", () => {
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
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        installments: "",
      },
    });
  });
});
