import { render, screen, within } from "@testing-library/react";
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

  it("põe cliente e vendor em lados opostos, mesmo para quem lê de fora", () => {
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
        ]}
      />,
    );

    const [cliente, vendor] = screen.getAllByRole("article");

    expect(cliente).toHaveClass("mr-auto");
    expect(cliente).not.toHaveClass("ml-auto");
    expect(vendor).toHaveClass("ml-auto");
    expect(vendor).not.toHaveClass("mr-auto");
  });

  it("mantém o mesmo lado em todas as mensagens do mesmo papel", () => {
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
          message({ id: 3, senderId: 17, senderRole: "customer" }),
          message({
            id: 4,
            senderId: 29,
            senderName: "Papeloto",
            senderRole: "seller",
          }),
        ]}
      />,
    );

    const sides = screen
      .getAllByRole("article")
      .map((article) => (article.classList.contains("ml-auto") ? "right" : "left"));

    expect(sides).toEqual(["left", "right", "left", "right"]);
  });

  it("o viewer não muda o lado: a mensagem própria segue o papel de quem escreveu", () => {
    render(
      <ChamadoMessageList
        messages={[
          message({ id: 1, isMine: true, senderId: 17, senderRole: "customer" }),
        ]}
      />,
    );

    expect(screen.getByRole("article")).toHaveClass("mr-auto");
  });

  it("a Papelito escalada fala do lado de quem atende", () => {
    render(
      <ChamadoMessageList
        messages={[
          message({
            id: 1,
            senderId: 1,
            senderName: "Suporte",
            senderRole: "administrator",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("article")).toHaveClass("ml-auto");
  });

  it("nome, crachá e data acompanham o lado do balão", () => {
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
        ]}
      />,
    );

    const [cliente, vendor] = screen.getAllByRole("article");

    expect(
      cliente.querySelector(".justify-end"),
      "identidade do cliente não é alinhada à direita",
    ).toBeNull();
    expect(vendor.querySelector(".justify-end")).not.toBeNull();

    expect(cliente.querySelector("time")?.closest("p")).not.toHaveClass(
      "text-right",
    );
    expect(vendor.querySelector("time")?.closest("p")).toHaveClass("text-right");
  });

  it("cada balão tem cauda, virada para o seu lado", () => {
    render(
      <ChamadoMessageList
        messages={[
          message({ id: 1, senderId: 17, senderRole: "customer" }),
          message({ id: 2, plainText: "Segunda do cliente", senderId: 17 }),
          message({
            id: 3,
            senderId: 29,
            senderName: "Papeloto",
            senderRole: "seller",
          }),
        ]}
      />,
    );

    const tails = screen.getAllByRole("article").map((article) => {
      const tail = article.querySelector(".chamado-tail");
      expect(tail, "balão sem cauda").not.toBeNull();
      return tail?.classList.contains("chamado-tail-right") ? "right" : "left";
    });

    expect(tails).toEqual(["left", "left", "right"]);
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

  it("balão que troca de lado sempre diz de quem é", () => {
    // A mensagem otimista da Papelito herda o `senderId` do cliente no painel do /admin: sem
    // olhar o papel, ela cairia à direita como continuação do bloco do cliente e sem crachá.
    render(
      <ChamadoMessageList
        messages={[
          message({ id: 1, senderId: 17, senderRole: "customer" }),
          message({
            id: -1,
            plainText: "Vamos verificar com o vendor.",
            senderId: 17,
            senderName: "Ana do Suporte",
            senderRole: "administrator",
          }),
        ]}
      />,
    );

    const [cliente, papelito] = screen.getAllByRole("article");

    expect(cliente).toHaveClass("mr-auto");
    expect(papelito).toHaveClass("ml-auto");
    expect(within(cliente).getByText("Cliente")).toBeInTheDocument();
    expect(within(papelito).getByText("Ana do Suporte")).toBeInTheDocument();
    expect(within(papelito).getByText("Papelito")).toBeInTheDocument();
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
