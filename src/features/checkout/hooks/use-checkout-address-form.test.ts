import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCheckoutAddressForm } from "./use-checkout-address-form";

describe("useCheckoutAddressForm", () => {
  it("auto-fills address fields after a valid cep lookup", async () => {
    const { result } = renderHook(() => useCheckoutAddressForm());

    await act(async () => {
      await result.current.handleZipCodeChange("01310930");
    });

    expect(result.current.form.zipCode).toBe("01310-930");
    expect(result.current.form.street).toBe("Rua das Flores");
    expect(result.current.form.neighborhood).toBe("Centro");
    expect(result.current.form.city).toBe("Sao Paulo");
    expect(result.current.form.state).toBe("SP");
    expect(result.current.isFormValid).toBe(false);

    act(() => {
      result.current.handleNumberChange("12-A!");
    });

    await waitFor(() => {
      expect(result.current.form.number).toBe("12A");
    });
  });
});
