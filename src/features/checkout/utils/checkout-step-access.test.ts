import { describe, expect, it } from "vitest";

import {
  getCheckoutStepAccess,
  isAddressFormComplete,
  resolveCartVendorId,
} from "./checkout-step-access";
import type { CheckoutAddressForm, PaymentForm } from "../types/checkout";

const COMPLETE_ADDRESS: CheckoutAddressForm = {
  zipCode: "01310-930",
  street: "Avenida Paulista",
  number: "1000",
  complement: "",
  neighborhood: "Bela Vista",
  city: "Sao Paulo",
  state: "SP",
};

const EMPTY_PAYMENT: PaymentForm = {
  holderName: "",
  installments: "",
  cardTokenId: "",
  cardLast4: "",
};

const SHIPPING_OPTION = {
  service: "PAC",
  code: "03298",
  name: "PAC Contrato",
  price: 15.88,
  deliveryTime: 5,
};

function access(overrides: Partial<Parameters<typeof getCheckoutStepAccess>[0]> = {}) {
  return getCheckoutStepAccess({
    items: [{ vendorId: 101 }],
    addressForm: COMPLETE_ADDRESS,
    selectedShippingOption: SHIPPING_OPTION,
    paymentMethod: "credit_card",
    paymentForm: { ...EMPTY_PAYMENT, cardTokenId: "token_123" },
    ...overrides,
  });
}

describe("resolveCartVendorId", () => {
  it("returns the vendor when every item shares it", () => {
    expect(resolveCartVendorId([{ vendorId: 7 }, { vendorId: 7 }])).toBe(7);
  });

  it("returns null for mixed or missing vendors", () => {
    expect(resolveCartVendorId([{ vendorId: 7 }, { vendorId: 8 }])).toBeNull();
    expect(resolveCartVendorId([{ vendorId: 7 }, { vendorId: null }])).toBeNull();
  });
});

describe("isAddressFormComplete", () => {
  it("requires 8 CEP digits and every mandatory field", () => {
    expect(isAddressFormComplete(COMPLETE_ADDRESS)).toBe(true);
    expect(isAddressFormComplete({ ...COMPLETE_ADDRESS, zipCode: "0131" })).toBe(false);
    expect(isAddressFormComplete({ ...COMPLETE_ADDRESS, number: "  " })).toBe(false);
  });
});

describe("getCheckoutStepAccess", () => {
  it("always allows the address step", () => {
    expect(
      access({
        addressForm: { ...COMPLETE_ADDRESS, street: "" },
        selectedShippingOption: null,
        paymentForm: EMPTY_PAYMENT,
      })[1],
    ).toBe(true);
  });

  it("locks payment until the address is complete", () => {
    expect(access({ addressForm: { ...COMPLETE_ADDRESS, city: "" } })[2]).toBe(false);
    expect(access()[2]).toBe(true);
  });

  it("locks payment until a freight option is chosen", () => {
    expect(access({ selectedShippingOption: null })[2]).toBe(false);
  });

  it("does not require freight when the cart has no single vendor", () => {
    expect(access({ items: [], selectedShippingOption: null })[2]).toBe(true);
    expect(
      access({ items: [{ vendorId: 1 }, { vendorId: 2 }], selectedShippingOption: null })[2],
    ).toBe(true);
  });

  it("locks review until a card token exists", () => {
    expect(access({ paymentForm: EMPTY_PAYMENT })[3]).toBe(false);
    expect(access()[3]).toBe(true);
  });

  it("does not require a card token for other payment methods", () => {
    expect(access({ paymentMethod: "pix", paymentForm: EMPTY_PAYMENT })[3]).toBe(true);
  });

  it("keeps review locked when the address regressed", () => {
    expect(access({ addressForm: { ...COMPLETE_ADDRESS, state: "" } })[3]).toBe(false);
  });
});
