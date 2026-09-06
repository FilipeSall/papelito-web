import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminCategory, AdminCollection } from "@/lib/server/admin-taxonomy";

import { TaxonomyPicker } from "./taxonomy-picker";

function subcategory(overrides: Partial<AdminCategory["subcategories"][number]>) {
  return {
    archivedAt: null,
    categoryId: 1,
    description: "",
    facet: "material",
    id: 10,
    isActive: true,
    name: "Brown",
    productCount: 0,
    slug: "brown",
    sortOrder: 0,
    ...overrides,
  };
}

function category(overrides: Partial<AdminCategory> = {}): AdminCategory {
  return {
    archivedAt: null,
    description: "",
    iconAttachmentId: null,
    iconUrl: null,
    id: 1,
    isActive: true,
    name: "Sedas",
    productCount: { published: 0, total: 0 },
    seoDescription: "",
    seoTitle: "",
    slug: "sedas",
    sortOrder: 0,
    subcategories: [
      subcategory({ facet: "material", id: 10, name: "Brown", slug: "brown" }),
      subcategory({ facet: "formato", id: 11, name: "King Size", slug: "king-size" }),
      subcategory({ facet: "formato", id: 12, name: "Slim", slug: "slim" }),
    ],
    ...overrides,
  };
}

function collection(overrides: Partial<AdminCollection> = {}): AdminCollection {
  return {
    archivedAt: null,
    description: "",
    id: 1,
    isActive: true,
    name: "Premium",
    productCount: { published: 0, total: 0 },
    slug: "premium",
    sortOrder: 0,
    ...overrides,
  };
}

const noop = vi.fn();

function renderPicker(props: Partial<Parameters<typeof TaxonomyPicker>[0]> = {}) {
  return render(
    <TaxonomyPicker
      categories={[category(), category({ id: 2, name: "Piteiras", slug: "piteiras", subcategories: [] })]}
      collections={[
        collection(),
        collection({ id: 2, name: "Edição Limitada", slug: "edicao-limitada", sortOrder: 1 }),
        collection({ id: 3, name: "Seleção Especial", slug: "selecao-especial", sortOrder: 2 }),
      ]}
      onCategoryChange={noop}
      onToggleCollection={noop}
      onToggleSubcategory={noop}
      selectedCategoryId=""
      selectedCollections={[]}
      selectedSubcategoryIds={[]}
      {...props}
    />,
  );
}

describe("TaxonomyPicker", () => {
  it("avisa que a categoria é obrigatória enquanto nenhuma é escolhida", () => {
    renderPicker();

    expect(screen.getByText(/Escolha a categoria para poder salvar/)).toBeInTheDocument();
  });

  it("só mostra subcategorias depois que a categoria é escolhida", () => {
    const { rerender } = renderPicker();

    expect(screen.queryByText("Brown")).not.toBeInTheDocument();

    rerender(
      <TaxonomyPicker
        categories={[category()]}
        collections={[]}
        onCategoryChange={noop}
        onToggleCollection={noop}
        onToggleSubcategory={noop}
        selectedCategoryId="1"
        selectedCollections={[]}
        selectedSubcategoryIds={[]}
      />,
    );

    expect(screen.getByText("Brown")).toBeInTheDocument();
  });

  it("agrupa as subcategorias por faceta", () => {
    renderPicker({ selectedCategoryId: "1" });

    expect(screen.getByText("Material")).toBeInTheDocument();
    expect(screen.getByText("Formato")).toBeInTheDocument();
  });

  it("mostra apenas as subcategorias da categoria escolhida", () => {
    renderPicker({ selectedCategoryId: "2" });

    expect(screen.queryByText("Brown")).not.toBeInTheDocument();
    expect(
      screen.getByText(/esta categoria ainda não tem subcategorias/),
    ).toBeInTheDocument();
  });

  it("mantém visível a subcategoria inativa que o produto já tem", () => {
    const withArchived = category({
      subcategories: [
        subcategory({ id: 10, isActive: false, name: "Hemp", slug: "hemp" }),
        subcategory({ facet: "formato", id: 11, name: "King Size", slug: "king-size" }),
      ],
    });

    const { rerender } = render(
      <TaxonomyPicker
        categories={[withArchived]}
        collections={[]}
        onCategoryChange={noop}
        onToggleCollection={noop}
        onToggleSubcategory={noop}
        selectedCategoryId="1"
        selectedCollections={[]}
        selectedSubcategoryIds={[]}
      />,
    );

    expect(screen.queryByText("Hemp")).not.toBeInTheDocument();

    rerender(
      <TaxonomyPicker
        categories={[withArchived]}
        collections={[]}
        onCategoryChange={noop}
        onToggleCollection={noop}
        onToggleSubcategory={noop}
        selectedCategoryId="1"
        selectedCollections={[]}
        selectedSubcategoryIds={["10"]}
      />,
    );

    expect(screen.getByText("Hemp")).toBeInTheDocument();
    expect(screen.getByText("inativa")).toBeInTheDocument();
  });

  it("permite marcar mais de uma subcategoria da mesma faceta", () => {
    const onToggleSubcategory = vi.fn();

    renderPicker({ onToggleSubcategory, selectedCategoryId: "1", selectedSubcategoryIds: ["11"] });

    fireEvent.click(screen.getByRole("checkbox", { name: /Slim/ }));

    expect(onToggleSubcategory).toHaveBeenCalledWith("12");
  });

  it("renderiza todas as coleções manuais que o backend devolve", () => {
    renderPicker({ selectedCategoryId: "1" });

    expect(screen.getByRole("checkbox", { name: "Premium" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Edição Limitada" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Seleção Especial" })).toBeInTheDocument();
  });

  it("funciona com uma única coleção e com nenhuma", () => {
    const { rerender } = renderPicker({ collections: [collection()], selectedCategoryId: "1" });

    expect(screen.getByRole("checkbox", { name: "Premium" })).toBeInTheDocument();

    rerender(
      <TaxonomyPicker
        categories={[category()]}
        collections={[]}
        onCategoryChange={noop}
        onToggleCollection={noop}
        onToggleSubcategory={noop}
        selectedCategoryId="1"
        selectedCollections={[]}
        selectedSubcategoryIds={[]}
      />,
    );

    expect(screen.queryByText("Coleções manuais")).not.toBeInTheDocument();
  });

  it("marca várias coleções ao mesmo tempo no mesmo produto", () => {
    renderPicker({
      selectedCategoryId: "1",
      selectedCollections: ["premium", "edicao-limitada"],
    });

    expect(screen.getByRole("checkbox", { name: "Premium" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Edição Limitada" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Seleção Especial" })).not.toBeChecked();
  });

  it("propaga o slug da coleção alternada sem tocar nas outras", () => {
    const onToggleCollection = vi.fn();

    renderPicker({
      onToggleCollection,
      selectedCategoryId: "1",
      selectedCollections: ["premium", "edicao-limitada"],
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Premium" }));

    expect(onToggleCollection).toHaveBeenCalledTimes(1);
    expect(onToggleCollection).toHaveBeenCalledWith("premium");
  });

  it("esconde coleção inativa que o produto não tem", () => {
    renderPicker({
      collections: [collection(), collection({ id: 2, isActive: false, name: "Aposentada", slug: "aposentada" })],
      selectedCategoryId: "1",
    });

    expect(screen.queryByRole("checkbox", { name: /Aposentada/ })).not.toBeInTheDocument();
  });

  it("mantém visível a coleção inativa que o produto já tem", () => {
    renderPicker({
      collections: [collection(), collection({ id: 2, isActive: false, name: "Aposentada", slug: "aposentada" })],
      selectedCategoryId: "1",
      selectedCollections: ["aposentada"],
    });

    const checkbox = screen.getByRole("checkbox", { name: /Aposentada/ });

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
  });

  it("não oferece categoria arquivada", () => {
    renderPicker({
      categories: [category({ archivedAt: "2026-01-01", isActive: false })],
    });

    expect(screen.queryByText("Sedas")).not.toBeInTheDocument();
  });
});
