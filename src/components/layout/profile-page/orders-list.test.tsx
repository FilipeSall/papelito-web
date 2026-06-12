import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrdersList } from "./orders-list";

function buildOrder(id: number) {
  return {
    id: String(id),
    orderNumber: `#${1000 + id}`,
    status: "awaiting_payment" as const,
    date: "12 de jun. de 2026",
    itemsCount: 1,
    total: 19.9,
  };
}

describe("OrdersList", () => {
  it("shows the empty state when there are no orders", () => {
    render(<OrdersList currentPage={1} orders={[]} totalPages={1} />);

    expect(
      screen.getByRole("heading", { name: /voce ainda nao fez seu primeiro pedido/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /paginação de pedidos/i })).not.toBeInTheDocument();
  });

  it("renders pagination controls when there is more than one page", () => {
    render(
      <OrdersList
        currentPage={2}
        orders={[buildOrder(11), buildOrder(12)]}
        totalPages={3}
      />,
    );

    expect(screen.getByText("#1011")).toBeInTheDocument();
    expect(screen.getByText("#1012")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /paginação de pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anterior" })).toHaveAttribute("href", "/perfil");
    expect(screen.getByRole("link", { name: "Próxima" })).toHaveAttribute("href", "/perfil?page=3");
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
  });
});
