import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VendorCancelShipmentModal } from "./vendor-cancel-shipment-modal";

describe("VendorCancelShipmentModal", () => {
  it("does not confirm without a justification and shows a validation error", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <VendorCancelShipmentModal
        onClose={vi.fn()}
        onConfirm={onConfirm}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: /confirmar cancelamento/i }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/informe o motivo do cancelamento/i)).toBeInTheDocument();
  });

  it("submits the trimmed justification when filled", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <VendorCancelShipmentModal
        onClose={vi.fn()}
        onConfirm={onConfirm}
        open
      />,
    );

    await user.type(screen.getByRole("textbox"), "  produto sem estoque  ");
    await user.click(screen.getByRole("button", { name: /confirmar cancelamento/i }));

    expect(onConfirm).toHaveBeenCalledWith("produto sem estoque");
  });

  it("closes without cancelling when Voltar is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <VendorCancelShipmentModal
        onClose={onClose}
        onConfirm={onConfirm}
        open
      />,
    );

    await user.click(screen.getByRole("button", { name: /voltar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
