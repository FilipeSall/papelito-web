import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { mapChamado } from "../services/chamado-mappers";
import { wpChamado } from "../../../../test/factories/chamado";

import { ChamadoOrderPanel } from "./chamado-order-panel";

const order = mapChamado(wpChamado()).order;

describe("ChamadoOrderPanel", () => {
  it("mostra o contexto do pedido certo", () => {
    render(<ChamadoOrderPanel order={order} reasonLabel="Atraso na entrega" role="customer" />);

    expect(screen.getByText("Pedido #14094")).toBeInTheDocument();
    expect(screen.getByText("Processando")).toBeInTheDocument();
    expect(screen.getByText("Papeloto")).toBeInTheDocument();
    expect(screen.getByText("Cartão de crédito")).toBeInTheDocument();
    expect(screen.getByText("Caderno Pautado")).toBeInTheDocument();
    expect(screen.getByText("Caneta Azul")).toBeInTheDocument();
    expect(screen.getByText("5 itens")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 54,00").length).toBeGreaterThan(0);
    // R$ 12,00 aparece duas vezes de propósito: é a linha da caneta e é o frete.
    expect(screen.getAllByText("R$ 12,00")).toHaveLength(2);
    expect(screen.getByText("R$ 42,00")).toBeInTheDocument();
  });

  it("leva ao pedido na rota da audiência, e o admin não recebe link", () => {
    const { rerender } = render(
      <ChamadoOrderPanel order={order} reasonLabel={null} role="customer" />,
    );
    expect(screen.getByRole("link", { name: /Ver pedido completo/ })).toHaveAttribute(
      "href",
      "/perfil/pedidos/14094",
    );

    rerender(<ChamadoOrderPanel order={order} reasonLabel={null} role="seller" />);
    expect(screen.getByRole("link", { name: /Ver pedido completo/ })).toHaveAttribute(
      "href",
      "/vendor/pedidos/14094",
    );

    rerender(<ChamadoOrderPanel order={order} reasonLabel={null} role="administrator" />);
    expect(screen.queryByRole("link", { name: /Ver pedido completo/ })).not.toBeInTheDocument();
  });

  it("sem contexto, degrada sem inventar valores", () => {
    render(
      <ChamadoOrderPanel
        fallbackOrderNumber="14094"
        order={null}
        reasonLabel="Atraso na entrega"
        role="administrator"
      />,
    );

    expect(screen.getByText("Pedido #14094")).toBeInTheDocument();
    expect(
      screen.getByText("Os dados desta compra não estão disponíveis para este atendimento."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("é colapsável e anuncia o estado para leitor de tela", async () => {
    const user = userEvent.setup();
    render(<ChamadoOrderPanel order={order} reasonLabel={null} role="customer" />);

    const toggle = screen.getByRole("button", { name: "Ver contexto do pedido" });
    // `matchMedia` do setup responde `matches: false`, então o padrão testado é o mobile.
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", expect.stringContaining("corpo"));

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Recolher contexto do pedido" }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
