import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderReceiptActions } from "./order-receipt-actions";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OrderReceiptActions", () => {
  it("downloads and sends the receipt for the current order", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ ok: true }),
        ok: true,
      }),
    );

    render(<OrderReceiptActions orderId="42" />);

    expect(screen.getByRole("link", { name: /baixar recibo/i })).toHaveAttribute(
      "href",
      "/api/profile/orders/42/receipt",
    );

    await user.click(screen.getByRole("button", { name: /enviar para meu e-mail/i }));

    expect(screen.getByText(/recibo enviado para o seu e-mail/i)).toBeInTheDocument();
  });
});
