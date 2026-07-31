import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RECEIPT_EMAIL_UNAVAILABLE_ORDER_ID } from "../../../../test/msw/handlers/profile-orders";

import { OrderReceiptActions } from "./order-receipt-actions";

describe("OrderReceiptActions", () => {
  it("downloads and sends the receipt for the current order", async () => {
    const user = userEvent.setup();

    render(<OrderReceiptActions orderId="42" />);

    expect(screen.getByRole("link", { name: /baixar recibo/i })).toHaveAttribute(
      "href",
      "/api/profile/orders/42/receipt",
    );

    await user.click(screen.getByRole("button", { name: /enviar para meu e-mail/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/recibo enviado para o seu e-mail/i);
  });

  it("reports a refusal from WordPress through an alert", async () => {
    const user = userEvent.setup();

    render(<OrderReceiptActions orderId={RECEIPT_EMAIL_UNAVAILABLE_ORDER_ID} />);

    await user.click(screen.getByRole("button", { name: /enviar para meu e-mail/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /nao ha e-mail verificado para o envio/i,
    );
  });
});
