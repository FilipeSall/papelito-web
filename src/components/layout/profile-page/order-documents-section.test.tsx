import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProfileOrderReceipt } from "@/features/orders";

import {
  RECEIPT_EMAIL_RATE_LIMITED_ORDER_ID,
  RECEIPT_EMAIL_UNAVAILABLE_ORDER_ID,
} from "../../../../test/msw/handlers/profile-orders";

import { OrderDocumentsSection } from "./order-documents-section";

function buildReceipt(overrides: Partial<ProfileOrderReceipt> = {}): ProfileOrderReceipt {
  return {
    available: true,
    issuedAtLabel: "03/07/2026 09:31",
    number: "PPL-2026-000482",
    ...overrides,
  };
}

describe("OrderDocumentsSection", () => {
  it("shows the receipt number, the issue date and the download link", () => {
    render(<OrderDocumentsSection orderId="42" receipt={buildReceipt()} />);

    expect(screen.getByText("PPL-2026-000482")).toBeInTheDocument();
    expect(screen.getByText(/emitido em 03\/07\/2026 09:31/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /baixar recibo/i })).toHaveAttribute(
      "href",
      "/api/profile/orders/42/receipt",
    );
  });

  it("copies the receipt number", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<OrderDocumentsSection orderId="42" receipt={buildReceipt()} />);

    await user.click(screen.getByRole("button", { name: /copiar número do recibo/i }));

    expect(writeText).toHaveBeenCalledWith("PPL-2026-000482");
  });

  it("sends the receipt by e-mail", async () => {
    const user = userEvent.setup();

    render(<OrderDocumentsSection orderId="42" receipt={buildReceipt()} />);

    await user.click(screen.getByRole("button", { name: /enviar para meu e-mail/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/recibo enviado para o seu e-mail/i);
  });

  it("announces the WordPress reason when the e-mail is refused", async () => {
    const user = userEvent.setup();

    render(
      <OrderDocumentsSection orderId={RECEIPT_EMAIL_UNAVAILABLE_ORDER_ID} receipt={buildReceipt()} />,
    );

    await user.click(screen.getByRole("button", { name: /enviar para meu e-mail/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /nao ha e-mail verificado para o envio/i,
    );
  });

  it("announces the rate limit as an alert", async () => {
    const user = userEvent.setup();

    render(
      <OrderDocumentsSection orderId={RECEIPT_EMAIL_RATE_LIMITED_ORDER_ID} receipt={buildReceipt()} />,
    );

    await user.click(screen.getByRole("button", { name: /enviar para meu e-mail/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/aguarde antes de solicitar outro envio/i);
  });

  it("hides the actions and explains why when the receipt is not available yet", () => {
    render(
      <OrderDocumentsSection
        orderId="42"
        receipt={buildReceipt({ available: false, issuedAtLabel: null, number: null })}
      />,
    );

    expect(screen.queryByRole("link", { name: /baixar recibo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enviar para meu e-mail/i })).not.toBeInTheDocument();
    expect(
      screen.getByText(/o recibo fica disponível após a confirmação do pagamento/i),
    ).toBeInTheDocument();
  });

  it("still offers the download while the receipt number was not issued yet", () => {
    render(
      <OrderDocumentsSection orderId="42" receipt={buildReceipt({ issuedAtLabel: null, number: null })} />,
    );

    expect(screen.getByRole("link", { name: /baixar recibo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /copiar número do recibo/i })).not.toBeInTheDocument();
  });
});
