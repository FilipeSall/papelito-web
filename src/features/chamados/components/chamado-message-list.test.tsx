import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ChamadoMessage } from "../types/chamado";

import { ChamadoMessageList } from "./chamado-message-list";

function message(overrides: Partial<ChamadoMessage> = {}): ChamadoMessage {
  return {
    content: null,
    createdAt: "2026-09-02 12:00:00",
    id: 1,
    isMine: false,
    plainText: "Oi",
    senderId: 17,
    senderName: "Ana Compradora",
    senderRole: "customer",
    ...overrides,
  };
}

describe("ChamadoMessageList", () => {
  it("identifica cliente, vendor e Papelito por crachá", () => {
    render(
      <ChamadoMessageList
        messages={[
          message({ id: 1, senderId: 17, senderRole: "customer" }),
          message({
            id: 2,
            senderId: 29,
            senderName: "Papeloto",
            senderRole: "seller",
          }),
          message({
            id: 3,
            senderId: 1,
            senderName: "Suporte",
            senderRole: "administrator",
          }),
        ]}
      />,
    );

    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Vendor")).toBeInTheDocument();
    expect(screen.getByText("Papelito")).toBeInTheDocument();
  });

  it("não mostra avatar ou iniciais dos participantes", () => {
    const { container } = render(
      <ChamadoMessageList
        messages={[
          message({ id: 1, senderName: "Ana Compradora" }),
          message({
            id: 2,
            senderId: 29,
            senderName: "Papeloto",
            senderRole: "seller",
          }),
        ]}
      />,
    );

    expect(screen.queryByText("AC")).not.toBeInTheDocument();
    expect(screen.queryByText("P")).not.toBeInTheDocument();
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("mostra identidade só na primeira mensagem de cada bloco do mesmo falante", () => {
    render(
      <ChamadoMessageList
        messages={[
          message({ id: 1 }),
          message({ id: 2, plainText: "Segunda" }),
        ]}
      />,
    );

    expect(screen.getAllByText("Cliente")).toHaveLength(1);
  });

  it("renderiza negrito e itálico a partir do conteúdo estruturado", () => {
    const { container } = render(
      <ChamadoMessageList
        messages={[
          message({
            content: [
              { text: "Motivo: ", type: "text", bold: true },
              { text: "com defeito", type: "text", italic: true },
            ],
          }),
        ]}
      />,
    );

    expect(container.querySelector("strong")?.textContent).toBe("Motivo: ");
    expect(container.querySelector("em")?.textContent).toBe("com defeito");
  });

  it("conteúdo malicioso é texto literal, nunca markup", () => {
    const { container } = render(
      <ChamadoMessageList
        messages={[
          message({
            content: [{ text: '<img src=x onerror="alert(1)">', type: "text" }],
          }),
        ]}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
    // O `onerror=` só existe escapado, como conteúdo de texto — que é exatamente o ponto.
    expect(
      screen.getByText('<img src=x onerror="alert(1)">'),
    ).toBeInTheDocument();
    expect(container.innerHTML).toContain("&lt;img src=x onerror=");
  });

  it("mostra estado vazio e estado de erro", () => {
    const { rerender } = render(<ChamadoMessageList messages={[]} />);
    expect(screen.getByText("Nenhuma mensagem ainda")).toBeInTheDocument();

    rerender(<ChamadoMessageList errored messages={[]} />);
    expect(
      screen.getByText("⚠ Não foi possível atualizar a conversa."),
    ).toBeInTheDocument();
  });

  it("não anima as mensagens já presentes na montagem", () => {
    const { container } = render(<ChamadoMessageList messages={[message()]} />);

    expect(container.querySelector(".animate-chamado-message")).toBeNull();
  });
});
