import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminCategory } from "@/lib/server/admin-taxonomy";

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

const noop = vi.fn();

function renderPicker(props: Partial<Parameters<typeof TaxonomyPicker>[0]> = {}) {
  return render(
    <TaxonomyPicker
      categories={[category(), category({ id: 2, name: "Piteiras", slug: "piteiras", subcategories: [] })]}
      collections={["premium", "kits"]}
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

  it("lista as coleções curadas", () => {
    renderPicker({ selectedCategoryId: "1" });

    expect(screen.getByRole("checkbox", { name: "Premium" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Kits" })).toBeInTheDocument();
  });

  it("não oferece categoria arquivada", () => {
    renderPicker({
      categories: [category({ archivedAt: "2026-01-01", isActive: false })],
    });

    expect(screen.queryByText("Sedas")).not.toBeInTheDocument();
  });
});
