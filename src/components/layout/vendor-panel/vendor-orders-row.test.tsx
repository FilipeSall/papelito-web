import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { VendorOrderSummary } from "@/features/vendor-orders/types/vendor-orders";

import { VendorOrdersRow } from "./vendor-orders-row";

function order(overrides: Partial<VendorOrderSummary> = {}): VendorOrderSummary {
  return {
    createdAt: "2026-09-01 10:00:00",
    customerName: "Marcos Stub de Oliveira",
    fiscalPending: true,
    hasFiscalDocument: false,
    id: 14094,
    itemsCount: 1,
    itemsLabel: "Green Herb Kit",
    nextStatuses: ["cancelado"],
    orderNumber: "14094",
    status: "em_separacao",
    total: 490,
    ...overrides,
  };
}

describe("VendorOrdersRow", () => {
  it("marca a linha quando o pedido tem nota emitida", () => {
    render(
      <ul>
        <VendorOrdersRow now={Date.parse("2026-09-05T10:00:00Z")} order={order({ hasFiscalDocument: true })} />
      </ul>,
    );

    expect(screen.getByText("Nota fiscal")).toBeInTheDocument();
  });

  it("não diz nada sobre nota quando o pedido não tem uma", () => {
    render(
      <ul>
        <VendorOrdersRow now={Date.parse("2026-09-05T10:00:00Z")} order={order()} />
      </ul>,
    );

    expect(screen.queryByText(/nota fiscal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sem nota/i)).not.toBeInTheDocument();
  });

  it("mostra a próxima ação e o estado do pedido", () => {
    render(
      <ul>
        <VendorOrdersRow now={Date.parse("2026-09-05T10:00:00Z")} order={order()} />
      </ul>,
    );

    expect(screen.getByText("Em separação")).toBeInTheDocument();
    expect(screen.getByText("Postar e informar o rastreio")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /abrir pedido #14094/i })).toHaveAttribute(
      "href",
      "/vendor/pedidos/14094",
    );
  });
});
