import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VendorOrderStatusStepper } from "./vendor-order-status-stepper";

const stepLabels = ["Pagamento", "Aguardando envio", "Separação", "Enviado", "Entregue"];

describe("VendorOrderStatusStepper", () => {
  it("renders all five steps in order", () => {
    render(<VendorOrderStatusStepper status="aguardando_pagamento" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    stepLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("marks the current step as active and shows the Atual badge", () => {
    render(<VendorOrderStatusStepper status="em_separacao" />);
    const items = screen.getAllByRole("listitem");

    expect(within(items[2]).getByText("Atual")).toBeInTheDocument();
    expect(within(items[0]).queryByText("Atual")).not.toBeInTheDocument();
    expect(within(items[3]).queryByText("Atual")).not.toBeInTheDocument();
  });

  it("shows a check icon on completed steps before the current one", () => {
    const { container } = render(<VendorOrderStatusStepper status="enviado" />);
    const items = within(container).getAllByRole("listitem");

    // steps 0..2 are completed -> rendered as svg check, current (3) and upcoming (4) show a number
    expect(within(items[0]).queryByText("1")).not.toBeInTheDocument();
    expect(within(items[3]).getByText("4")).toBeInTheDocument();
    expect(within(items[4]).getByText("5")).toBeInTheDocument();
  });

  it("renders the active state on the first step for an unpaid order", () => {
    render(<VendorOrderStatusStepper status="aguardando_pagamento" />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("Atual")).toBeInTheDocument();
  });

  it("renders the cancelled state instead of the progress stepper", () => {
    render(<VendorOrderStatusStepper status="cancelado" cancelReason="produto sem estoque" />);

    expect(screen.getByText(/pedido cancelado/i)).toBeInTheDocument();
    expect(screen.getByText("produto sem estoque")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.queryByText("Atual")).not.toBeInTheDocument();
  });
});
