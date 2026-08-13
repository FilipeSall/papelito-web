import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_RICH_TEXT_CONTEXT, type RichTextResolutionContext } from "@/features/rich-text";
import type { ProductBenefitItem } from "@/types/product-benefits";

import { ProductBenefitsBar } from "./product-benefits-bar";
import { resolveProductBenefits } from "./resolve-items";

function item(overrides: Partial<ProductBenefitItem> = {}): ProductBenefitItem {
  return {
    id: 1,
    iconType: "emoji",
    iconEmoji: "🚚",
    iconUrl: "",
    title: "Frete Grátis",
    description: "Com cupom",
    descriptionContent: null,
    ...overrides,
  };
}

function renderBar(items: ProductBenefitItem[], context: RichTextResolutionContext = EMPTY_RICH_TEXT_CONTEXT) {
  return render(<ProductBenefitsBar items={resolveProductBenefits(items, context)} />);
}

describe("ProductBenefitsBar", () => {
  it("não renderiza nada quando não há benefício", () => {
    const { container } = renderBar([]);

    expect(container).toBeEmptyDOMElement();
  });

  it.each([2, 3, 4, 5, 7])("renderiza %i itens sem perder nenhum", (total) => {
    renderBar(
      Array.from({ length: total }, (_, index) =>
        item({ id: index + 1, title: `Benefício ${index + 1}` }),
      ),
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(total);
  });

  it("mantém a ordem recebida do backend", () => {
    renderBar([
      item({ id: 1, title: "Primeiro" }),
      item({ id: 2, title: "Segundo" }),
      item({ id: 3, title: "Terceiro" }),
    ]);

    expect(screen.getAllByRole("listitem").map((node) => node.textContent)).toEqual([
      "🚚PrimeiroCom cupom",
      "🚚SegundoCom cupom",
      "🚚TerceiroCom cupom",
    ]);
  });

  it("renderiza item sem descrição com apenas ícone e título", () => {
    renderBar([item({ description: "", descriptionContent: null, title: "Só título" })]);

    const [entry] = screen.getAllByRole("listitem");

    expect(entry.textContent).toBe("🚚Só título");
  });

  it("usa o grid adaptativo, não uma contagem fixa de colunas", () => {
    const { container } = renderBar([item(), item({ id: 2 })]);
    const list = container.querySelector("ul");

    expect(list?.className).toContain("grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))]");
    expect(list?.className).not.toContain("grid-cols-3");
  });

  it("renderiza ícone SVG como imagem e emoji como texto", () => {
    renderBar([
      item({ id: 1, iconType: "svg", iconEmoji: "", iconUrl: "/images/icons/truck.svg" }),
      item({ id: 2, iconType: "emoji", iconEmoji: "🔒", title: "Pagamento" }),
    ]);

    expect(screen.getByRole("presentation", { hidden: true })).toBeInTheDocument();
    expect(screen.getByText("🔒")).toBeInTheDocument();
  });

  it("aceita identidades de renderização distintas para rascunhos sem id", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const [first, second] = resolveProductBenefits(
      [item({ id: 0, title: "Primeiro" }), item({ id: 0, title: "Segundo" })],
      EMPTY_RICH_TEXT_CONTEXT,
    );

    render(
      <ProductBenefitsBar
        items={[
          { ...first, renderKey: "draft-1" },
          { ...second, renderKey: "draft-2" },
        ]}
      />,
    );

    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("resolveProductBenefits", () => {
  const FREE_SHIPPING_DOCUMENT = [
    { type: "text" as const, text: "A partir de " },
    { type: "token" as const, token: "frete_gratis.minimo" },
    { type: "text" as const, text: " com cupom" },
  ];

  it("resolve o token do mínimo de frete grátis", () => {
    renderBar([item({ description: "Com cupom", descriptionContent: FREE_SHIPPING_DOCUMENT })], {
      ...EMPTY_RICH_TEXT_CONTEXT,
      freeShippingMinimumCents: 9900,
    });

    expect(screen.getByText("A partir de R$ 99,00 com cupom")).toBeInTheDocument();
  });

  it("degrada para o texto plano quando o token não resolve", () => {
    renderBar([item({ description: "Com cupom", descriptionContent: FREE_SHIPPING_DOCUMENT })], {
      ...EMPTY_RICH_TEXT_CONTEXT,
      freeShippingMinimumCents: null,
    });

    expect(screen.getByText("Com cupom")).toBeInTheDocument();
    expect(screen.queryByText(/A partir de/)).not.toBeInTheDocument();
  });

  it("esconde a descrição quando o token falha e não há texto plano", () => {
    renderBar([item({ description: "", descriptionContent: FREE_SHIPPING_DOCUMENT })], {
      ...EMPTY_RICH_TEXT_CONTEXT,
      freeShippingMinimumCents: null,
    });

    const [entry] = screen.getAllByRole("listitem");

    expect(entry.textContent).toBe("🚚Frete Grátis");
  });
});
