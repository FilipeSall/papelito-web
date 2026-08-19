import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductFilterSidebar } from "./product-filter-sidebar";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderSidebar(
  variant: "default" | "collection",
  props: Partial<React.ComponentProps<typeof ProductFilterSidebar>> = {},
) {
  render(
    <ProductFilterSidebar
      selectedTypes={[]}
      viewMode="grid"
      perPage={9}
      variant={variant}
      {...props}
    />,
  );
}

describe("ProductFilterSidebar", () => {
  it("usa o acabamento de coleção com bordas quadradas", () => {
    renderSidebar("collection");

    expect(screen.getByText("Filtros").parentElement).toHaveClass(
      "border-2",
      "border-[#1a1a1a]",
      "rounded-none",
    );
    expect(screen.getByPlaceholderText("Min")).toHaveClass("border-2", "rounded-none");
    expect(screen.getByRole("button", { name: "Aplicar preço" })).toHaveClass(
      "border-2",
      "rounded-none",
    );
  });

  it("mantém o acabamento padrão do catálogo", () => {
    renderSidebar("default");

    expect(screen.getByText("Filtros").parentElement).toHaveClass("rounded-xl");
    expect(screen.getByPlaceholderText("Min")).toHaveClass("rounded-lg");
    expect(screen.getByRole("button", { name: "Aplicar preço" })).toHaveClass("rounded-lg");
  });

  it("mostra os preços aplicados quando a faixa é válida", () => {
    renderSidebar("default", { minPrice: 100, maxPrice: 130 });

    expect(screen.getByPlaceholderText("Min")).toHaveValue("100");
    expect(screen.getByPlaceholderText("Max")).toHaveValue("130");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  /**
   * O erro sozinho não basta: sem devolver o que foi digitado, o usuário lê uma mensagem sobre
   * valores que não estão mais na tela e não tem como corrigi-los.
   */
  it("preserva o que foi digitado quando a faixa é inválida", () => {
    renderSidebar("default", {
      minPrice: null,
      maxPrice: null,
      rawMinPrice: "1000",
      rawMaxPrice: "1",
      priceError: "O preço mínimo não pode ser maior que o preço máximo.",
    });

    const minimum = screen.getByPlaceholderText("Min");
    const maximum = screen.getByPlaceholderText("Max");

    expect(minimum).toHaveValue("1000");
    expect(maximum).toHaveValue("1");
    expect(minimum).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "O preço mínimo não pode ser maior que o preço máximo.",
    );
    expect(minimum).toHaveAttribute("aria-describedby", screen.getByRole("alert").id);
  });
});
