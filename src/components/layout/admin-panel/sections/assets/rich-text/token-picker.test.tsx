import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TokenPicker } from "./token-picker";

describe("TokenPicker", () => {
  it("pesquisa, explica e insere uma variável", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<TokenPicker onClose={vi.fn()} onSelect={onSelect} promotionProducts={[]} />);

    expect(document.activeElement).toBe(screen.getByRole("searchbox", { name: /buscar dado dinâmico/i }));
    expect(screen.getByRole("region", { name: "Produto em promoção" })).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: /buscar dado dinâmico/i }), "parcelas");
    expect(screen.getByText("Máximo de parcelas")).toBeInTheDocument();
    expect(screen.queryByText("Frete grátis cupom")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /saiba mais sobre máximo de parcelas/i }));
    expect(screen.getByText("Admin → Cupons → Configuração de parcelamento.")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Inserir" })[0]);
    expect(onSelect).toHaveBeenCalledWith("parcelamento.maximo");
  });

  it("pede um produto da campanha antes de inserir uma variável de produto", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TokenPicker
        onClose={vi.fn()}
        onSelect={onSelect}
        promotionProducts={[{ discount: 20, name: "Seda King Size", originalPrice: 10, price: 8, productId: 8 }]}
      />,
    );

    const productRow = screen.getByText("Nome do produto").closest("li");
    expect(productRow).not.toBeNull();
    await user.click(within(productRow as HTMLElement).getByRole("button", { name: "Inserir" }));
    expect(screen.getByRole("heading", { name: /escolha o produto/i })).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: /buscar produto em promoção/i }), "Seda");
    await user.click(screen.getByRole("button", { name: /voltar para variáveis/i }));
    expect(screen.getByText("Frete grátis cupom")).toBeInTheDocument();

    await user.click(within(screen.getByText("Nome do produto").closest("li") as HTMLElement).getByRole("button", { name: "Inserir" }));

    await user.click(screen.getByRole("button", { name: "Inserir" }));
    expect(onSelect).toHaveBeenCalledWith("produto.nome", { productId: "8" });
  });
});
