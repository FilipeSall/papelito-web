import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FreeShippingThresholdSettings } from "./free-shipping-threshold-settings";

describe("FreeShippingThresholdSettings", () => {
  it("validates BRL input before saving", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <FreeShippingThresholdSettings
        initialMinimumOrderCents={9900}
        onSaved={vi.fn()}
      />,
    );

    const input = screen.getByLabelText(/pedido mínimo/i);
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/valor monetário positivo/i);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("saves cents and reports the persisted value", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ minimumOrderCents: 12550 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <FreeShippingThresholdSettings
        initialMinimumOrderCents={9900}
        onSaved={onSaved}
      />,
    );

    const input = screen.getByLabelText(/pedido mínimo/i);
    await user.clear(input);
    await user.type(input, "125,50");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/shipping/free-shipping-threshold", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ minimumOrderCents: 12550 }),
    });
    expect(onSaved).toHaveBeenCalledWith(12550);
    vi.unstubAllGlobals();
  });
});
