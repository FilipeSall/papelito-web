import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { KitStockRow } from "./kit-stock-row";
import type { VendorStockItem, VendorStockKit } from "@/features/vendor-stock/types/vendor-stock";

const kit: VendorStockKit = {
  assemblableQty: 2,
  items: [
    {
      imageUrl: "",
      isZeroed: false,
      productId: 21,
      productName: "Caderno Universitário",
      qty: 8,
      quantity: 2,
      sku: "PROD-001",
    },
    {
      imageUrl: "",
      isZeroed: true,
      productId: 22,
      productName: "Caneta Azul",
      qty: 0,
      quantity: 3,
      sku: "PROD-002",
    },
  ],
  kitId: 5,
  slug: "kit-escolar-completo",
};

const item: VendorStockItem = {
  categories: [],
  imageUrl: "",
  isPubliclyViewable: false,
  isZeroed: false,
  kit,
  productId: 30,
  publicProductId: 30,
  productName: "Kit Escolar Completo",
  qty: 4,
  sku: "KIT-001",
  tags: [],
  updatedAt: "ontem",
};

function renderKit(override: Partial<VendorStockKit> = {}, onQtyChange = () => {}) {
  return render(
    <table>
      <tbody>
        <KitStockRow
          columnCount={4}
          focused={false}
          item={item}
          kit={{ ...kit, ...override }}
          onQtyChange={onQtyChange}
          quantities={{}}
          savingIds={new Set()}
        />
      </tbody>
    </table>,
  );
}

describe("KitStockRow", () => {
  it("marks the row as a kit", () => {
    renderKit();

    expect(screen.getByTestId("stock-kit-row")).toBeInTheDocument();
    expect(screen.getByText("Kit")).toBeInTheDocument();
  });

  it("has no quantity input of its own — the kit is not stocked directly", () => {
    renderKit();

    expect(screen.queryByLabelText(/quantidade de kit escolar completo/i)).not.toBeInTheDocument();
  });

  it("shows how many times the kit can be sold, derived from the items", () => {
    const { rerender } = renderKit();

    expect(screen.getByTestId("stock-kit-sellable")).toHaveTextContent(/^2vendas possíveis$/);

    rerender(
      <table>
        <tbody>
          <KitStockRow
            columnCount={4}
            focused={false}
            item={item}
            kit={{ ...kit, assemblableQty: 1 }}
            onQtyChange={() => {}}
            quantities={{}}
            savingIds={new Set()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId("stock-kit-sellable")).toHaveTextContent(/^1venda possível$/);
  });

  it("reads the status badge from what the kit can assemble, not from its own stock row", () => {
    renderKit({ assemblableQty: 0 });

    expect(screen.getByText("Zerado")).toBeInTheDocument();
  });

  it("renders the kit components subordinated to the kit, with their quantity in the kit", () => {
    renderKit();

    const composition = within(screen.getByTestId("stock-kit-items"));
    expect(composition.getByText("Caderno Universitário")).toBeInTheDocument();
    expect(composition.getByText("2x por kit")).toBeInTheDocument();
    expect(composition.getByText("Caneta Azul")).toBeInTheDocument();
    expect(composition.getByText("3x por kit")).toBeInTheDocument();
  });

  it("edits the stock through the components, with the same autosave handler", () => {
    const onQtyChange = vi.fn();
    renderKit({}, onQtyChange);

    const input = screen.getByLabelText(/quantidade de caneta azul/i);
    expect(input).toHaveValue(0);

    fireEvent.change(input, { target: { value: "9" } });

    expect(onQtyChange).toHaveBeenCalledWith(22, "9");
  });

  it("explains that the kit follows its components", () => {
    renderKit();

    expect(screen.getByText(/ajuste os itens para mudar quantas vendas/i)).toBeInTheDocument();
  });

  it("links the kit to its public page when the slug is known", () => {
    renderKit();

    expect(screen.getByRole("link", { name: /kit escolar completo/i })).toHaveAttribute(
      "href",
      "/kits/kit-escolar-completo",
    );
  });

  it("falls back to plain text when the kit has no slug", () => {
    renderKit({ slug: "" });

    expect(screen.queryByRole("link", { name: /kit escolar completo/i })).not.toBeInTheDocument();
    expect(screen.getByText("Kit Escolar Completo")).toBeInTheDocument();
  });

  it("states when the kit has no components yet", () => {
    renderKit({ items: [] });

    expect(screen.getByText(/ainda não tem produtos cadastrados/i)).toBeInTheDocument();
  });
});
