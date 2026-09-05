import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_RICH_TEXT_CONTEXT } from "@/features/rich-text";
import type { PromoMarqueeItem } from "@/types/home-assets";

import { MarqueeGroup } from "./marquee-group";

const messages: PromoMarqueeItem[] = [
  { content: null, id: "one", isActive: true, order: 1, text: "⚡ Oferta" },
];

const messagesWithToken: PromoMarqueeItem[] = [
  {
    content: [
      { type: "text", text: "🔥 FRETE GRÁTIS a partir de " },
      { type: "token", token: "frete_gratis.minimo" },
      { type: "text", text: " com cupom" },
    ],
    id: "frete",
    isActive: true,
    order: 1,
    text: "🔥 FRETE GRÁTIS a partir de  com cupom",
  },
];

function renderGroup(props: Partial<Parameters<typeof MarqueeGroup>[0]> = {}) {
  return render(
    <MarqueeGroup
      isSaving={false}
      issues={[]}
      messages={messages}
      notice={null}
      onAdd={vi.fn(() => "novo")}
      onChange={vi.fn()}
      onMove={vi.fn()}
      onRemove={vi.fn()}
      onSave={vi.fn(async () => true)}
      persistedMessages={messages}
      richTextContext={EMPTY_RICH_TEXT_CONTEXT}
      {...props}
    />,
  );
}

describe("MarqueeGroup", () => {
  it("lista uma linha por mensagem e abre o editor no clique", async () => {
    const user = userEvent.setup();
    renderGroup();

    expect(screen.getByText(/faixa de avisos · 1 mensagem/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /editar ⚡ oferta/i }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/faixa de avisos · mensagem 1/i)).toBeInTheDocument();
  });

  it("resolve o token na prévia enquanto o editor mostra o chip", async () => {
    const user = userEvent.setup();
    renderGroup({
      messages: messagesWithToken,
      persistedMessages: messagesWithToken,
      richTextContext: { ...EMPTY_RICH_TEXT_CONTEXT, freeShippingMinimumCents: 9900 },
    });

    expect(
      screen.getAllByText("🔥 FRETE GRÁTIS a partir de R$ 99,00 com cupom").length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole("button", { name: /editar 🔥 frete grátis a partir de/i }),
    );

    expect(screen.getAllByText("Frete grátis cupom").length).toBeGreaterThan(0);
  });

  it("avisa quando a faixa ficaria oculta e quando o dado dinâmico não existe", async () => {
    const user = userEvent.setup();
    renderGroup({ messages: messagesWithToken, persistedMessages: messagesWithToken });

    expect(screen.getByText(/a faixa ficará oculta sem mensagens ativas/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /editar 🔥 frete grátis a partir de/i }),
    );

    expect(screen.getAllByText(/esta mensagem ficaria oculta no site/i).length).toBeGreaterThan(0);
  });

  it("bloqueia o salvamento enquanto faltam mensagens ativas", () => {
    renderGroup();

    expect(screen.getByRole("alert")).toHaveTextContent(/selecione pelo menos 3 frases/i);
    expect(screen.getByRole("button", { name: /salvar faixa/i })).toBeDisabled();
  });

  it("mostra estado vazio quando não há mensagem cadastrada", () => {
    renderGroup({ messages: [], persistedMessages: [] });

    expect(screen.getByText(/nenhuma mensagem cadastrada/i)).toBeInTheDocument();
  });

  it("pede confirmação antes de remover uma mensagem", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderGroup({ onRemove });

    await user.click(screen.getByRole("button", { name: /remover mensagem 1/i }));
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /^remover mensagem$/i }));
    expect(onRemove).toHaveBeenCalledWith("one");
  });
});
