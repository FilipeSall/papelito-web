import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCheckoutPaymentForm } from "./use-checkout-payment-form";

describe("useCheckoutPaymentForm", () => {
  it("requires valid card fields for credit card payments", () => {
    const { result } = renderHook(() => useCheckoutPaymentForm());

    expect(result.current.canContinue).toBe(false);

    act(() => {
      result.current.updateField("holderName", "Maria da Silva");
      result.current.handleCardNumberChange("4111111111111111");
      result.current.handleExpiryDateChange("1228");
      result.current.handleCvvChange("1234");
      result.current.updateField("installments", "3x");
    });

    expect(result.current.form.cardNumber).toBe("4111 1111 1111 1111");
    expect(result.current.form.expiryDate).toBe("12/28");
    expect(result.current.form.cvv).toBe("1234");
    expect(result.current.canContinue).toBe(true);
  });

  it("always allows pix and boleto", () => {
    const { result } = renderHook(() => useCheckoutPaymentForm());

    act(() => {
      result.current.setMethod("pix");
    });
    expect(result.current.canContinue).toBe(true);

    act(() => {
      result.current.setMethod("boleto");
    });
    expect(result.current.canContinue).toBe(true);
  });
});
