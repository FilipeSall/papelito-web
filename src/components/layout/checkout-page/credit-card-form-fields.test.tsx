import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CreditCardFormFields } from "./credit-card-form-fields";

describe("CreditCardFormFields", () => {
  it("gera opções até o máximo recebido da configuração", async () => {
    const user = userEvent.setup();

    render(
      <CreditCardFormFields
        cardNumber=""
        cvv=""
        expiryDate=""
        holderName=""
        installments=""
        maxInstallments={10}
        onCardNumberChange={vi.fn()}
        onCvvChange={vi.fn()}
        onExpiryDateChange={vi.fn()}
        onHolderNameChange={vi.fn()}
        onInstallmentsChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /selecione as parcelas/i }));

    expect(screen.getAllByRole("option")).toHaveLength(10);
    expect(screen.getByRole("option", { name: "10x sem juros" })).toBeInTheDocument();
  });
});
