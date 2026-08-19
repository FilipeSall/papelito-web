import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CategoryFilterTree } from "./category-filter-tree";
import type { ProductsCatalogCategory } from "@/features/catalog";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const CATEGORY_TREE: ProductsCatalogCategory[] = [
  {
    name: "Sedas",
    slug: "sedas",
    subcategories: [
      { facet: "material", name: "Tradicional", slug: "tradicional" },
      { facet: "material", name: "Brown", slug: "brown" },
      { facet: "formato", name: "Slim", slug: "slim" },
      { facet: "formato", name: "King Size", slug: "king-size" },
    ],
  },
  {
    name: "Piteiras",
    slug: "piteiras",
    subcategories: [
      { facet: "tamanho", name: "Slim", slug: "slim" },
      { facet: "tamanho", name: "Mega Longa", slug: "mega-longa" },
    ],
  },
  { name: "Acessórios", slug: "acessorios", subcategories: [] },
];

const OPTIONS = [
  { id: "todos", label: "Todos" },
  { id: "sedas", label: "SEDAS" },
  { id: "piteiras", label: "PITEIRAS" },
  { id: "acessorios", label: "ACESSÓRIOS" },
];

function renderTree(
  props: Partial<React.ComponentProps<typeof CategoryFilterTree>> = {},
) {
  return render(
    <CategoryFilterTree
      basePath="/produtos"
      categoryTree={CATEGORY_TREE}
      collection="todos"
      maxPrice={null}
      minPrice={null}
      options={OPTIONS}
      perPage={9}
      selectedSubcategories={[]}
      selectedTypes={[]}
      variant="default"
      viewMode="grid"
      {...props}
    />,
  );
}

function lastHref() {
  return push.mock.calls.at(-1)?.[0] as string;
}

function paramsOfLastHref() {
  return new URLSearchParams(lastHref().split("?")[1] ?? "");
}

function subcategoryGroup() {
  return screen.getByRole("group", { name: "Subcategorias de Sedas" });
}

describe("CategoryFilterTree", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("renderiza uma caixa por categoria, com `Todos` marcado sem filtro", () => {
    renderTree();

    expect(screen.getByRole("checkbox", { name: "Todos" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Sedas" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Piteiras" })).not.toBeChecked();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("categoria sem subcategoria não abre árvore nenhuma", () => {
    renderTree({ selectedTypes: ["acessorios"] });

    expect(screen.getByRole("checkbox", { name: "Acessórios" })).toBeChecked();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("categoria selecionada revela as subcategorias, todas marcadas", () => {
    renderTree({ selectedTypes: ["sedas"] });

    const group = subcategoryGroup();
    for (const name of ["Tradicional", "Brown", "Slim", "King Size"]) {
      expect(within(group).getByRole("checkbox", { name })).toBeChecked();
    }
  });

  it("agrupa as subcategorias por faceta quando há mais de uma", () => {
    renderTree({ selectedTypes: ["sedas"] });

    expect(screen.getByRole("group", { name: "material" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "formato" })).toBeInTheDocument();
  });

  it("não rotula a faceta única", () => {
    renderTree({ selectedTypes: ["piteiras"] });

    expect(screen.queryByRole("group", { name: "tamanho" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Subcategorias de Piteiras" }),
    ).toBeInTheDocument();
  });

  it("subcategoria de uma categoria não vaza para outra", () => {
    renderTree({ selectedTypes: ["piteiras"] });

    expect(
      screen.queryByRole("group", { name: "Subcategorias de Sedas" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Brown" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Mega Longa" })).toBeInTheDocument();
  });

  it("marcar a categoria navega para `?tipo=`, sem subcategoria", async () => {
    const user = userEvent.setup();
    renderTree();

    await user.click(screen.getByRole("checkbox", { name: "Sedas" }));

    expect(lastHref()).toBe("/produtos?tipo=sedas&perPage=9");
  });

  it("desmarcar uma subcategoria refina a listagem pela faceta", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"] });

    await user.click(within(subcategoryGroup()).getByRole("checkbox", { name: "Brown" }));

    const params = paramsOfLastHref();
    expect(params.get("tipo")).toBe("sedas");
    expect(params.get("subcategoria")).toBe("sedas.tradicional");
  });

  it("remarcar a subcategoria volta a listar a categoria inteira", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"], selectedSubcategories: ["sedas.tradicional"] });

    await user.click(within(subcategoryGroup()).getByRole("checkbox", { name: "Brown" }));

    expect(paramsOfLastHref().get("subcategoria")).toBeNull();
  });

  it("a URL reflete só as subcategorias pedidas", () => {
    renderTree({ selectedTypes: ["sedas"], selectedSubcategories: ["sedas.brown"] });

    const group = subcategoryGroup();
    expect(within(group).getByRole("checkbox", { name: "Brown" })).toBeChecked();
    expect(within(group).getByRole("checkbox", { name: "Tradicional" })).not.toBeChecked();
    // `formato` não foi restringido: continua inteiro marcado.
    expect(within(group).getByRole("checkbox", { name: "Slim" })).toBeChecked();
  });

  /**
   * Estado ambíguo não existe: sem nenhum item marcado a faceta simplesmente parou de
   * filtrar, então ela volta inteira e a categoria continua selecionada.
   */
  it("desmarcar a última subcategoria da faceta limpa a restrição da faceta", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"], selectedSubcategories: ["sedas.brown"] });

    await user.click(within(subcategoryGroup()).getByRole("checkbox", { name: "Brown" }));

    const params = paramsOfLastHref();
    expect(params.get("subcategoria")).toBeNull();
    expect(params.get("tipo")).toBe("sedas");
  });

  it("`Todos` limpa categoria e subcategoria", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"], selectedSubcategories: ["sedas.brown"] });

    await user.click(screen.getByRole("checkbox", { name: "Todos" }));

    expect(lastHref()).toBe("/produtos?perPage=9");
  });

  it("desmarcar a última categoria descarta o refinamento dela", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"], selectedSubcategories: ["sedas.brown"] });

    await user.click(screen.getByRole("checkbox", { name: "Sedas" }));

    expect(lastHref()).toBe("/produtos?perPage=9");
  });

  it("cada categoria marcada abre a própria árvore", () => {
    renderTree({ selectedTypes: ["sedas", "piteiras"] });

    expect(screen.getByRole("group", { name: "Subcategorias de Sedas" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Subcategorias de Piteiras" }),
    ).toBeInTheDocument();
  });

  /**
   * O slug não é único no catálogo: `slim` existe em Sedas e em Piteiras. Sem o
   * escopo na URL, refinar uma categoria refinaria a outra junto.
   */
  it("refinar uma categoria não mexe na outra", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas", "piteiras"] });

    const sedas = screen.getByRole("group", { name: "Subcategorias de Sedas" });
    await user.click(within(sedas).getByRole("checkbox", { name: "Slim" }));

    expect(paramsOfLastHref().get("subcategoria")).toBe("sedas.king-size");
  });

  it("preserva o refinamento das outras categorias ao refinar uma", async () => {
    const user = userEvent.setup();
    renderTree({
      selectedSubcategories: ["piteiras.mega-longa"],
      selectedTypes: ["sedas", "piteiras"],
    });

    const sedas = screen.getByRole("group", { name: "Subcategorias de Sedas" });
    await user.click(within(sedas).getByRole("checkbox", { name: "Brown" }));

    expect(paramsOfLastHref().get("subcategoria")).toBe(
      "piteiras.mega-longa,sedas.tradicional",
    );
  });

  it("cada categoria marca as próprias subcategorias, sem vazar o escopo", () => {
    renderTree({
      selectedSubcategories: ["sedas.slim"],
      selectedTypes: ["sedas", "piteiras"],
    });

    const sedas = screen.getByRole("group", { name: "Subcategorias de Sedas" });
    const piteiras = screen.getByRole("group", { name: "Subcategorias de Piteiras" });

    expect(within(sedas).getByRole("checkbox", { name: "Slim" })).toBeChecked();
    expect(within(sedas).getByRole("checkbox", { name: "King Size" })).not.toBeChecked();
    // Piteiras não foi refinada: continua inteira marcada, `slim` incluso.
    expect(within(piteiras).getByRole("checkbox", { name: "Slim" })).toBeChecked();
    expect(within(piteiras).getByRole("checkbox", { name: "Mega Longa" })).toBeChecked();
  });

  it("desmarcar uma categoria leva junto só o refinamento dela", async () => {
    const user = userEvent.setup();
    renderTree({
      selectedSubcategories: ["sedas.brown", "piteiras.mega-longa"],
      selectedTypes: ["sedas", "piteiras"],
    });

    await user.click(screen.getByRole("checkbox", { name: "Sedas" }));

    const params = paramsOfLastHref();
    expect(params.get("tipo")).toBe("piteiras");
    expect(params.get("subcategoria")).toBe("piteiras.mega-longa");
  });

  it("preserva busca, faixa de preço, visualização e itens por página", async () => {
    const user = userEvent.setup();
    renderTree({
      maxPrice: 120,
      minPrice: 10,
      perPage: 24,
      search: "seda brown",
      selectedTypes: ["sedas"],
      viewMode: "list",
    });

    await user.click(within(subcategoryGroup()).getByRole("checkbox", { name: "Brown" }));

    const params = paramsOfLastHref();
    expect(params.get("precoMin")).toBe("10");
    expect(params.get("precoMax")).toBe("120");
    expect(params.get("busca")).toBe("seda brown");
    expect(params.get("view")).toBe("list");
    expect(params.get("perPage")).toBe("24");
    expect(params.get("subcategoria")).toBe("sedas.tradicional");
  });

  /** Filtro que muda o total de resultados não pode cair numa página que não existe mais. */
  it("mudar o filtro volta para a primeira página", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"] });

    await user.click(within(subcategoryGroup()).getByRole("checkbox", { name: "Slim" }));

    expect(paramsOfLastHref().get("page")).toBeNull();
  });

  it("é operável por teclado", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"] });

    const brown = within(subcategoryGroup()).getByRole("checkbox", { name: "Brown" });
    brown.focus();
    await user.keyboard(" ");

    expect(paramsOfLastHref().get("subcategoria")).toBe("sedas.tradicional");
  });

  it("não rola a página ao aplicar um filtro", async () => {
    const user = userEvent.setup();
    renderTree({ selectedTypes: ["sedas"] });

    await user.click(within(subcategoryGroup()).getByRole("checkbox", { name: "Brown" }));

    expect(push.mock.calls.at(-1)?.[1]).toEqual({ scroll: false });
  });
});
