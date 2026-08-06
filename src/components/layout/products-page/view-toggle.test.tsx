import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ViewToggle } from "./view-toggle";

function renderToggle(props: Partial<Parameters<typeof ViewToggle>[0]> = {}) {
  render(
    <ViewToggle
      basePath="/kits"
      collection="promocoes"
      activeView="grid"
      selectedTypes={[]}
      minPrice={null}
      maxPrice={null}
      perPage={9}
      {...props}
    />,
  );

  return {
    grid: screen.getByRole("link", { name: "Visualização em grade" }),
    list: screen.getByRole("link", { name: "Visualização em lista" }),
  };
}

describe("ViewToggle", () => {
  it("no default da lista, o link de grade volta para o default da grade", () => {
    const { grid } = renderToggle({ activeView: "list", perPage: 18 });

    expect(grid).toHaveAttribute("href", "/kits?colecao=promocoes&perPage=9");
  });

  it("preserva um perPage que já é da grade", () => {
    const { grid } = renderToggle({ perPage: 12 });

    expect(grid).toHaveAttribute("href", "/kits?colecao=promocoes&perPage=12");
  });

  it("sobe para o default da lista quando o perPage atual é de grade", () => {
    const { list } = renderToggle({ perPage: 12 });

    expect(list).toHaveAttribute("href", "/kits?colecao=promocoes&view=list&perPage=18");
  });

  it("não carrega a página atual: mudar de visualização muda o total de páginas", () => {
    const { grid, list } = renderToggle({ activeView: "list", perPage: 30 });

    expect(grid.getAttribute("href")).not.toContain("page=");
    expect(list.getAttribute("href")).not.toContain("page=");
  });

  it("preserva os filtros ativos nos dois links", () => {
    const { grid, list } = renderToggle({
      selectedTypes: ["sedas"],
      minPrice: 10,
      maxPrice: 50,
      search: "hemp",
    });

    for (const link of [grid, list]) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toContain("tipo=sedas");
      expect(href).toContain("colecao=promocoes");
      expect(href).toContain("precoMin=10");
      expect(href).toContain("precoMax=50");
      expect(href).toContain("busca=hemp");
    }
  });
});
