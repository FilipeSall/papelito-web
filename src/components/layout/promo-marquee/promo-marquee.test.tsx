import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PromoMarquee, type PromoMarqueeMessage } from "./promo-marquee";

function message(id: string, text: string): PromoMarqueeMessage {
  return { id, nodes: [{ text, bold: false, italic: false }] };
}

const messages: PromoMarqueeMessage[] = [
  message("one", "⚡ Oferta"),
  message("two", "🌿 Novidade"),
  message("three", "🏆 Campeão"),
];

describe("PromoMarquee", () => {
  it("duplica as mensagens para o loop contínuo", () => {
    render(<PromoMarquee items={messages} />);
    expect(screen.getAllByText("⚡ Oferta")).toHaveLength(2);
  });

  it("fica oculta abaixo do mínimo de mensagens", () => {
    const { container } = render(<PromoMarquee items={messages.slice(0, 2)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("ignora mensagem sem conteúdo resolvido", () => {
    render(<PromoMarquee items={[...messages, { id: "vazia", nodes: [] }]} />);
    expect(screen.getAllByText("🏆 Campeão")).toHaveLength(2);
    expect(screen.queryByTestId("vazia")).not.toBeInTheDocument();
  });

  it("renderiza negrito e itálico como elementos, nunca como HTML cru", () => {
    render(
      <PromoMarquee
        items={[
          ...messages,
          {
            id: "rica",
            nodes: [
              { text: "Só hoje ", bold: false, italic: false },
              { text: "15% OFF", bold: true, italic: true },
            ],
          },
        ]}
      />,
    );

    const emphasis = screen.getAllByText("15% OFF")[0];
    expect(emphasis.tagName).toBe("EM");
    expect(emphasis.parentElement?.tagName).toBe("STRONG");
  });
});
