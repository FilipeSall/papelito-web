import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { VendorStockManager } from "./vendor-stock-manager";
import type {
  VendorStockSnapshot,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

const taxonomies: VendorStockTaxonomies = { categories: [], collections: [], tags: [] };

const filters = {
  category: null,
  collection: null,
  filter: "all" as const,
  search: "",
  sort: "name_asc" as const,
  tags: [],
  type: "products" as const,
};

const snapshot: VendorStockSnapshot = {
  items: [
    {
      categories: [],
      imageUrl: "",
      isPubliclyViewable: true,
      isZeroed: false,
      kit: null,
      productId: 10,
      publicProductId: 10,
      productName: "Seda King Size",
      qty: 5,
      sku: "SK-1",
      tags: [],
      updatedAt: "ontem",
    },
  ],
  page: 1,
  perPage: 20,
  total: 1,
};

const kitSnapshot: VendorStockSnapshot = {
  items: [
    {
      categories: [],
      imageUrl: "",
      isPubliclyViewable: false,
      isZeroed: false,
      kit: {
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
        ],
        kitId: 5,
        slug: "kit-escolar",
      },
      productId: 30,
      publicProductId: 30,
      productName: "Kit Escolar",
      qty: 4,
      sku: "KIT-001",
      tags: [],
      updatedAt: "ontem",
    },
  ],
  page: 1,
  perPage: 20,
  total: 1,
};

describe("VendorStockManager auto-save", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
    );
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("has no Salvar buttons", () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    expect(screen.queryByRole("button", { name: /salvar/i })).not.toBeInTheDocument();
  });

  it("names the timestamp column as the latest update", () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    expect(screen.getByRole("columnheader", { name: "Última atualização" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Último ajuste" })).not.toBeInTheDocument();
  });

  it("debounces the PUT and sends the new quantity once", async () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    const input = screen.getByLabelText(/quantidade de seda king size/i);

    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "12" } });

    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(800);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vendor/stock",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ product_id: 10, qty: 12 }),
      }),
    );
  });

  it("saves the component product when the quantity is edited inside the kit", async () => {
    render(<VendorStockManager filters={filters} snapshot={kitSnapshot} taxonomies={taxonomies} />);

    expect(screen.queryByLabelText(/quantidade de kit escolar/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/quantidade de caderno universitário/i), {
      target: { value: "10" },
    });
    await vi.advanceTimersByTimeAsync(800);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vendor/stock",
      expect.objectContaining({ body: JSON.stringify({ product_id: 21, qty: 10 }) }),
    );
  });

  it("does not save when the value is unchanged from the snapshot", () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    const input = screen.getByLabelText(/quantidade de seda king size/i);

    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.change(input, { target: { value: "5" } });
    vi.advanceTimersByTime(800);

    expect(fetch).not.toHaveBeenCalled();
  });
});
