import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

import { VendorStockManager } from "./vendor-stock-manager";
import type {
  VendorStockFilters,
  VendorStockItem,
  VendorStockSnapshot,
  VendorStockSummary,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

const taxonomies: VendorStockTaxonomies = { categories: [], collections: [], tags: [] };

const filters: VendorStockFilters = {
  category: null,
  collection: null,
  filter: "all",
  perPage: 20,
  search: "",
  sort: "name_asc",
  tags: [],
  type: "products",
};

const summary: VendorStockSummary = {
  available: 350,
  coveragePercent: 70,
  eligible: 500,
  incomplete: 11,
  lowStock: 18,
  lowStockThreshold: 5,
  outOfStock: 7,
  unconfigured: 143,
};

function item(overrides: Partial<VendorStockItem> = {}): VendorStockItem {
  return {
    categories: [],
    imageUrl: "",
    isPubliclyViewable: true,
    isUnconfigured: false,
    isZeroed: false,
    kit: null,
    missingFields: [],
    productId: 10,
    publicProductId: 10,
    productName: "Seda King Size",
    qty: 5,
    sku: "SK-1",
    tags: [],
    updatedAt: "ontem",
    ...overrides,
  };
}

function snapshotOf(items: VendorStockItem[]): VendorStockSnapshot {
  return { items, lowStockThreshold: 5, page: 1, perPage: 20, total: items.length };
}

const snapshot = snapshotOf([item()]);

const kitSnapshot = snapshotOf([
  item({
    isPubliclyViewable: false,
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
    productName: "Kit Escolar",
    publicProductId: 30,
    qty: 4,
    sku: "KIT-001",
  }),
]);

function renderManager(snapshotOverride: VendorStockSnapshot = snapshot) {
  return render(
    <VendorStockManager
      contactPhone="+55 61 99973-3064"
      filters={filters}
      snapshot={snapshotOverride}
      summary={summary}
      taxonomies={taxonomies}
    />,
  );
}

describe("VendorStockManager auto-save", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    push.mockClear();
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
    renderManager();
    expect(screen.queryByRole("button", { name: /^salvar$/i })).not.toBeInTheDocument();
  });

  it("names the timestamp column as the latest update", () => {
    renderManager();
    expect(screen.getByRole("columnheader", { name: "Última atualização" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Último ajuste" })).not.toBeInTheDocument();
  });

  it("debounces the PUT and sends the new quantity once", async () => {
    renderManager();
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
    renderManager(kitSnapshot);

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
    renderManager();
    const input = screen.getByLabelText(/quantidade de seda king size/i);

    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.change(input, { target: { value: "5" } });
    vi.advanceTimersByTime(800);

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("VendorStockManager seleção em lote", () => {
  beforeEach(() => {
    refresh.mockClear();
    push.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ failed: [], ok: true, qty: 15, updated: 2 }),
        }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const twoProducts = snapshotOf([
    item(),
    item({ productId: 11, productName: "Piteira Slim", publicProductId: 11, qty: 2, sku: "SK-2" }),
  ]);

  it("keeps the bulk bar hidden until something is selected", () => {
    renderManager(twoProducts);

    expect(screen.queryByLabelText("Definir estoque")).not.toBeInTheDocument();
  });

  it("applies one quantity to every selected product in a single request", async () => {
    renderManager(twoProducts);

    fireEvent.click(screen.getByLabelText("Selecionar todos os produtos desta página"));

    expect(screen.getByText("2 produtos")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Definir estoque"), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /aplicar a 2 itens/i }));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vendor/stock/bulk",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ product_ids: [10, 11], qty: 15 }),
      }),
    );

    expect(await screen.findByText("Estoque 15 aplicado a 2 produtos.")).toBeInTheDocument();
    expect(screen.getByLabelText(/quantidade de seda king size/i)).toHaveValue(15);
    expect(screen.getByLabelText(/quantidade de piteira slim/i)).toHaveValue(15);
  });

  it("cancels an autosave already scheduled when bulk changes the same product", async () => {
    vi.useFakeTimers();
    let releaseBulk!: (value: unknown) => void;
    const bulkResponse = new Promise((resolve) => {
      releaseBulk = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input) === "/api/vendor/stock/bulk") {
        return bulkResponse;
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderManager(twoProducts);
    fireEvent.change(screen.getByLabelText(/quantidade de seda king size/i), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByLabelText("Selecionar todos os produtos desta página"));
    fireEvent.change(screen.getByLabelText("Definir estoque"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: /aplicar a 2 itens/i }));

    await vi.advanceTimersByTimeAsync(800);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/vendor/stock/bulk",
      expect.objectContaining({ method: "POST" }),
    );

    releaseBulk({
      ok: true,
      json: () => Promise.resolve({ failed: [], qty: 20, updated: 2 }),
    });
    await vi.waitFor(() => expect(screen.getByLabelText(/quantidade de seda king size/i)).toHaveValue(20));
  });

  it("aborts an autosave in flight when bulk changes the same product", async () => {
    vi.useFakeTimers();
    let releaseAutosave!: (value: unknown) => void;
    let releaseBulk!: (value: unknown) => void;
    const autosaveResponse = new Promise((resolve) => {
      releaseAutosave = resolve;
    });
    const bulkResponse = new Promise((resolve) => {
      releaseBulk = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input) === "/api/vendor/stock") return autosaveResponse;
      if (String(input) === "/api/vendor/stock/bulk") return bulkResponse;
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderManager(twoProducts);
    fireEvent.change(screen.getByLabelText(/quantidade de seda king size/i), {
      target: { value: "3" },
    });
    await vi.advanceTimersByTimeAsync(800);
    const autosaveInit = fetchMock.mock.calls[0]?.[1] ?? {};

    fireEvent.click(screen.getByLabelText("Selecionar todos os produtos desta página"));
    fireEvent.change(screen.getByLabelText("Definir estoque"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: /aplicar a 2 itens/i }));

    expect(autosaveInit.signal).toBeDefined();
    expect(autosaveInit.signal).toHaveProperty("aborted", true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    releaseBulk({
      ok: true,
      json: () => Promise.resolve({ failed: [], qty: 20, updated: 2 }),
    });
    await vi.waitFor(() => expect(screen.getByLabelText(/quantidade de seda king size/i)).toHaveValue(20));

    releaseAutosave({ ok: true, json: () => Promise.resolve({}) });
    await vi.waitFor(() => expect(screen.getByLabelText(/quantidade de seda king size/i)).toHaveValue(20));
  });

  it("states how many items the confirmation will change before writing", () => {
    renderManager(twoProducts);

    fireEvent.click(screen.getByLabelText("Selecionar Seda King Size"));

    expect(screen.getByRole("button", { name: /aplicar a 1 item/i })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not offer a kit for bulk stock, because a kit has no stock of its own", () => {
    renderManager(kitSnapshot);

    expect(screen.queryByLabelText("Selecionar Kit Escolar")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Selecionar todos os produtos desta página"),
    ).not.toBeInTheDocument();
  });

  it("reports a partial failure instead of claiming success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              failed: [{ message: "Produto não encontrado.", product_id: 11 }],
              ok: false,
              qty: 15,
              updated: 1,
            }),
        }),
      ),
    );

    renderManager(twoProducts);

    fireEvent.click(screen.getByLabelText("Selecionar todos os produtos desta página"));
    fireEvent.change(screen.getByLabelText("Definir estoque"), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /aplicar a 2 itens/i }));

    expect(await screen.findByText("1 de 2 atualizados. 1 falharam.")).toBeInTheDocument();
    expect(screen.getByText(/produto 11/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantidade de piteira slim/i)).toHaveValue(2);
  });
});

describe("VendorStockManager cadastro incompleto", () => {
  const incomplete = snapshotOf([
    item({ missingFields: ["image", "weight"], qty: 40 }),
  ]);

  beforeEach(() => {
    push.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ created: 1, ok: true }) }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("names the missing fields on the row instead of a generic warning", () => {
    renderManager(incomplete);

    expect(
      screen.getByText("Dados incompletos · faltando imagem e peso"),
    ).toBeInTheDocument();
  });

  it("opens the request with the detected fields and sends only product and message", async () => {
    renderManager(incomplete);

    fireEvent.click(screen.getByRole("button", { name: /solicitar dados/i }));

    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getByText("Faltando imagem e peso")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText(/recado/i), {
      target: { value: "Tenho 40 unidades paradas." },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: /enviar solicitação/i }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/vendor/stock/data-request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "Tenho 40 unidades paradas.",
          product_id: 10,
        }),
      }),
    );

    expect(await screen.findByText("Solicitação enviada à Papelito.")).toBeInTheDocument();
  });

  it("prefills the WhatsApp text with the product and the missing fields", () => {
    renderManager(incomplete);

    const link = screen.getByRole("link", { name: /falar no whatsapp/i });

    expect(link).toHaveAttribute(
      "href",
      "https://wa.me/5561999733064?text=" +
        encodeURIComponent(
          'Olá! Tenho estoque de "Seda King Size", mas o cadastro está sem imagem e peso. Conseguem atualizar para mim?',
        ),
    );
  });

  it("offers no WhatsApp link when no support phone is configured", () => {
    render(
      <VendorStockManager
        contactPhone=""
        filters={filters}
        snapshot={incomplete}
        summary={summary}
        taxonomies={taxonomies}
      />,
    );

    expect(screen.queryByRole("link", { name: /falar no whatsapp/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /solicitar dados/i })).toBeInTheDocument();
  });
});
