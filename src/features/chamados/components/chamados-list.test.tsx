import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mapChamadoSummary } from "../services/chamado-mappers";
import { wpChamado } from "../../../../test/factories/chamado";

import { ChamadosList } from "./chamados-list";

const aberto = mapChamadoSummary(wpChamado());
const encerrado = mapChamadoSummary(
  wpChamado({
    closed_at: "2026-09-05 08:00:00",
    order_number: "14095",
    reason: "devolucao",
    reason_label: "Solicitação de devolução",
    status: "ENCERRADO",
    thread_id: 8,
  }),
);

describe("ChamadosList", () => {
  it("mostra pedido, motivo, situação e data de abertura", () => {
    render(<ChamadosList audience="customer" items={[aberto]} />);

    expect(screen.getByText("Pedido #14094")).toBeInTheDocument();
    expect(screen.getByText("Atraso na entrega")).toBeInTheDocument();
    expect(screen.getByText("Aberto")).toBeInTheDocument();
    expect(screen.getByText("Aberto em 02/09/2026, 09:00")).toBeInTheDocument();
  });

  it("distingue encerrado por texto, não só por cor", () => {
    render(<ChamadosList audience="customer" items={[aberto, encerrado]} />);

    expect(screen.getByText("Aberto")).toBeInTheDocument();
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
  });

  it("leva cada audiência para a própria rota", () => {
    const { rerender } = render(<ChamadosList audience="customer" items={[aberto]} />);
    expect(screen.getByRole("link", { name: "Abrir registro" })).toHaveAttribute(
      "href",
      "/perfil/chamados/7",
    );

    rerender(<ChamadosList audience="vendor" items={[aberto]} />);
    expect(screen.getByRole("link", { name: "Abrir registro" })).toHaveAttribute(
      "href",
      "/vendor/chamados/7",
    );

    rerender(<ChamadosList audience="admin" items={[aberto]} />);
    expect(screen.getByRole("link", { name: "Abrir registro" })).toHaveAttribute(
      "href",
      "/admin/chamados?chamado=7",
    );
  });

  it("marca as mensagens não lidas", () => {
    render(
      <ChamadosList
        audience="customer"
        items={[mapChamadoSummary(wpChamado({ unread_count: 3 }))]}
      />,
    );

    expect(screen.getByText("3 novas")).toBeInTheDocument();
  });

  it("mostra o estado vazio com a explicação recebida", () => {
    render(
      <ChamadosList
        audience="customer"
        emptyBody="Abra um chamado pela página do pedido."
        emptyTitle="Nenhum chamado ainda"
        items={[]}
      />,
    );

    expect(screen.getByText("Nenhum chamado ainda")).toBeInTheDocument();
    expect(screen.getByText("Abra um chamado pela página do pedido.")).toBeInTheDocument();
  });

  it("oferece busca só onde há rota de busca", () => {
    const { rerender } = render(<ChamadosList audience="customer" items={[aberto]} />);
    expect(screen.queryByRole("button", { name: "Buscar" })).not.toBeInTheDocument();

    rerender(
      <ChamadosList audience="vendor" items={[aberto]} searchAction="/vendor/chamados" />,
    );
    expect(screen.getByRole("button", { name: "Buscar" })).toBeInTheDocument();
  });
});
