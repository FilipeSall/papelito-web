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

  it("separates completed, current and upcoming without relying on colour", () => {
    const { container } = render(<VendorOrderStatusStepper status="enviado" />);
    const items = within(container).getAllByRole("listitem");

    // Cada estado tem uma palavra própria: a esteira é lida também impressa e
    // por quem não distingue as cores da marca.
    expect(within(items[0]).getByText("Concluído")).toBeInTheDocument();
    expect(within(items[3]).getByText("Atual")).toBeInTheDocument();
    expect(within(items[4]).getByText("A seguir")).toBeInTheDocument();
  });

  it("swaps the step icon for a check once the step is completed", () => {
    const { container } = render(<VendorOrderStatusStepper status="enviado" />);
    const items = within(container).getAllByRole("listitem");

    expect(items[0].querySelector(".lucide-check")).toBeTruthy();
    expect(items[4].querySelector(".lucide-check")).toBeNull();
    expect(items[4].querySelector("svg")).toBeTruthy();
  });

  it("announces the current step position for screen readers", () => {
    render(<VendorOrderStatusStepper status="em_separacao" />);

    expect(screen.getByRole("list")).toHaveAccessibleName("Etapa 3 de 5: Separação");
    expect(screen.getAllByRole("listitem")[2]).toHaveAttribute("aria-current", "step");
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
