import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCollectionFilters } from "./product-collection-filters";

function renderFilters(
  props: Partial<React.ComponentProps<typeof ProductCollectionFilters>> = {},
) {
  render(
    <ProductCollectionFilters
      activeCollection="todos"
      perPage={9}
      viewMode="grid"
      {...props}
    />,
  );
}

describe("ProductCollectionFilters", () => {
  it("marca a coleção selecionada com o preenchimento escuro do catálogo", () => {
    renderFilters();

    const tudo = screen.getByRole("link", { name: /tudo/i });

    expect(tudo).toHaveClass("rounded-xl", "border-brand-dark", "bg-brand-dark");
    expect(tudo).not.toHaveClass("border-2", "border-[#1a1a1a]");
    expect(tudo).toHaveAttribute("aria-current", "page");
  });

  it("usa a tipografia discreta do catálogo no subtítulo", () => {
    renderFilters();

    expect(screen.getByText("Linha premium")).toHaveClass("sm:text-xs", "text-text-muted");
  });

  /**
   * Reescrever `?colecao=` no caminho atual servia promoções sob a URL de premium e
   * mandava quem estava em `/kits` para `/produtos`.
   */
  it("navega para a rota própria de cada coleção", () => {
    renderFilters({ activeCollection: "kits", perPage: 12 });

    expect(screen.getByRole("link", { name: /tudo/i })).toHaveAttribute(
      "href",
      "/colecoes?perPage=12",
    );
    expect(screen.getByRole("link", { name: /premium/i })).toHaveAttribute(
      "href",
      "/premium?perPage=12",
    );
    expect(screen.getByRole("link", { name: /recém chegados/i })).toHaveAttribute(
      "href",
      "/novidades?perPage=12",
    );
    expect(screen.getByRole("link", { name: /promoções/i })).toHaveAttribute(
      "href",
      "/promocoes?perPage=12",
    );
    expect(screen.getByRole("link", { name: /kits/i })).toHaveAttribute(
      "href",
      "/kits?perPage=12",
    );
  });

  it("leva só a preferência de leitura e a busca para a próxima coleção", () => {
    renderFilters({ perPage: 24, search: "seda", viewMode: "list" });

    expect(screen.getByRole("link", { name: /premium/i })).toHaveAttribute(
      "href",
      "/premium?view=list&perPage=24&busca=seda",
    );
  });
});
