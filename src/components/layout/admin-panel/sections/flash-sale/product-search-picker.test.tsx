import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AdminFlashSaleCandidate } from "@/lib/server/admin-flash-sale";
import { ProductSearchPicker } from "./product-search-picker";

const product: AdminFlashSaleCandidate = {
  category: { id: 7, name: "Sedas", slug: "sedas" },
  dateModified: "",
  id: 11796,
  images: [],
  name: "Seda Slim King Size",
  permalink: "",
  price: "99.90",
  regularPrice: "121.00",
  sku: "PP01070003",
  status: "publish",
  tags: [],
};

/** O picker agora recebe categorias da taxonomia Papelito, não termos do Woo. */
const categorias = [
  {
    archivedAt: null,
    description: "",
    iconAttachmentId: null,
    iconUrl: null,
    id: 7,
    isActive: true,
    name: "Sedas",
    productCount: { published: 20, total: 20 },
    seoDescription: "",
    seoTitle: "",
    slug: "sedas",
    sortOrder: 0,
    subcategories: [],
  },
];

describe("ProductSearchPicker", () => {
  it("keeps pagination visible above the scroll list and navigates to page two", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <ProductSearchPicker
        candidates={[product]}
        categories={categorias}
        currentPage={1}
        filters={{ category: "", search: "" }}
        isSearching={false}
        onAdd={vi.fn()}
        onApply={vi.fn()}
        onFiltersChange={vi.fn()}
        onPageChange={onPageChange}
        selectedIds={new Set()}
        totalPages={2}
        totalProducts={40}
      />,
    );

    const navigation = screen.getByRole("navigation", { name: "Paginação de produtos" });
    const list = screen.getByRole("list");
    expect(navigation.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("submits name, SKU or ID search with Enter and preserves selected products", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onFiltersChange = vi.fn();

    render(
      <ProductSearchPicker
        candidates={[product]}
        categories={categorias}
        currentPage={2}
        filters={{ category: "", search: "PP01070003" }}
        isSearching={false}
        onAdd={vi.fn()}
        onApply={onApply}
        onFiltersChange={onFiltersChange}
        onPageChange={vi.fn()}
        selectedIds={new Set([11796])}
        totalPages={2}
        totalProducts={40}
      />,
    );

    const input = screen.getByRole("searchbox", { name: "Buscar produtos por nome, SKU ou ID" });
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Adicionar Seda Slim King Size" })).toBeDisabled();
  });
});
