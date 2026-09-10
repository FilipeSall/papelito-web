import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { VendorReturn } from "@/features/returns/types/vendor-return";

import { VendorReturnActions } from "./vendor-return-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const RETURN_AWAITING_AUTHORIZATION: VendorReturn = {
  id: 7,
  orderId: 14094,
  status: "awaiting_reverse_authorization",
  reason: "defective",
  reasonOther: "",
  authorizationCode: "",
  authorizationInstructions: "",
  authorizationExpiresAt: "",
  reverseShipmentId: 0,
  requestedAt: "2026-09-09 22:24:00",
  receivedAt: "",
  refundDueAt: "",
  refundedAt: "",
  eligibleAmountCents: 49000,
  items: [],
  refund: null,
};

describe("VendorReturnActions", () => {
  it("explica o código de autorização pelo tooltip associado ao campo", async () => {
    const user = userEvent.setup();

    render(<VendorReturnActions data={RETURN_AWAITING_AUTHORIZATION} />);

    expect(screen.getByLabelText("Código de autorização *")).toHaveAttribute(
      "id",
      "return-authorization-code",
    );
    expect(screen.queryByText("O código de autorização é o que o cliente apresenta para postar.")).not.toBeInTheDocument();

    await user.tab();

    expect(screen.getByRole("button", { name: "Mais informações" })).toHaveFocus();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "É o código emitido pela loja, pelo seu contrato com os Correios",
    );
  });
});
