import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SalesSectionNav } from "./sales-section-nav";

const SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "graficos", label: "Gráficos" },
  { id: "pedidos", label: "Pedidos" },
  { id: "exportar-vendas", label: "Exportações" },
] as const;

describe("SalesSectionNav", () => {
  it("expõe as seções como navegação nomeada e ancorada", () => {
    render(<SalesSectionNav sections={SECTIONS} />);

    const nav = screen.getByRole("navigation", { name: "Seções desta página" });
    const links = screen.getAllByRole("link");

    expect(nav).toBeInTheDocument();
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "#resumo",
      "#graficos",
      "#pedidos",
      "#exportar-vendas",
    ]);
  });

  it("marca a seção ativa com aria-current", () => {
    render(<SalesSectionNav sections={SECTIONS} />);

    expect(screen.getByRole("link", { name: "Resumo" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Pedidos" })).not.toHaveAttribute("aria-current");
  });

  it("marca a seção no clique, sem esperar o scroll", async () => {
    const user = userEvent.setup();
    render(<SalesSectionNav sections={SECTIONS} />);

    await user.click(screen.getByRole("link", { name: "Pedidos" }));

    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Resumo" })).not.toHaveAttribute("aria-current");
  });

  it("recolhe e reabre a lista, tirando os links da ordem de tabulação", async () => {
    const user = userEvent.setup();
    render(<SalesSectionNav sections={SECTIONS} />);

    const toggle = screen.getByRole("button", { name: "Recolher" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);

    const collapsed = screen.getByRole("button", { name: "Seções" });
    expect(collapsed).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Pedidos" })).not.toBeInTheDocument();

    await user.click(collapsed);

    expect(screen.getByRole("link", { name: "Pedidos" })).toBeInTheDocument();
  });

  it("percorre os links por teclado, na ordem da página", async () => {
    const user = userEvent.setup();
    render(<SalesSectionNav sections={SECTIONS} />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Recolher" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Resumo" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Gráficos" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("link", { name: "Exportações" })).toHaveFocus();
  });

  it("não fala mais em fita", () => {
    const { container } = render(<SalesSectionNav sections={SECTIONS} />);

    expect(container.textContent?.toLowerCase()).not.toContain("fita");
  });
})
