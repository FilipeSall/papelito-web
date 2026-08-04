import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminProductsSnapshot } from "@/lib/server/admin-products";

import { useAdminProductsManager } from "./use-admin-products-manager";

const product = {
  categories: [],
  dateModified: "",
  dateOnSaleFrom: "",
  dateOnSaleTo: "",
  description: "",
  dimensions: { height: "", length: "", width: "" },
  id: 123,
  images: [],
  manageStock: false,
  name: "Produto",
  permalink: "",
  price: "10",
  regularPrice: "10",
  salePrice: "",
  shortDescription: "",
  sku: "",
  slug: "produto",
  status: "publish",
  stockQuantity: null,
  stockStatus: "instock",
  tags: [],
  type: "simple",
  weight: "0.4",
};

const snapshot: AdminProductsSnapshot = {
  categories: [],
  currentPage: 1,
  issues: [],
  perPage: 20,
  products: [product],
  tags: [],
  totalPages: 1,
  totalProducts: 1,
};

function ManagerHarness({ initialSnapshot = snapshot }: { initialSnapshot?: AdminProductsSnapshot }) {
  const manager = useAdminProductsManager(initialSnapshot);

  return (
    <>
      <input
        aria-label="comprimento"
        onChange={(event) => manager.updateDraft("length", event.target.value)}
        value={manager.draft.length}
      />
      <input
        aria-label="largura"
        onChange={(event) => manager.updateDraft("width", event.target.value)}
        value={manager.draft.width}
      />
      <input
        aria-label="altura"
        onChange={(event) => manager.updateDraft("height", event.target.value)}
        value={manager.draft.height}
      />
      <input
        aria-label="preço regular"
        onChange={(event) => manager.updateDraft("regularPrice", event.target.value)}
        value={manager.draft.regularPrice}
      />
      <input
        aria-label="preço promocional"
        onChange={(event) => manager.updateDraft("salePrice", event.target.value)}
        value={manager.draft.salePrice}
      />
      <input
        aria-label="sku"
        onChange={(event) => manager.updateDraft("sku", event.target.value)}
        value={manager.draft.sku}
      />
      <input
        aria-label="peso"
        onChange={(event) => manager.updateDraft("weight", event.target.value)}
        value={manager.draft.weight}
      />
      <output aria-label="tags selecionadas">{manager.draft.tagIds.join(",")}</output>
      <output aria-label="aviso">{manager.notice}</output>
      <input
        aria-label="nova tag"
        onChange={(event) => manager.setNewTagName(event.target.value)}
        value={manager.newTagName}
      />
      <button onClick={() => void manager.handleCreateTag(manager.newTagName, true)} type="button">
        adicionar tag nova
      </button>
      <button onClick={() => void manager.handleCreateTag("  EXISTENTE  ", true)} type="button">
        adicionar tag existente
      </button>
      <button onClick={() => manager.toggleDraftTerm("tagIds", "8")} type="button">
        remover tag existente
      </button>
      <button onClick={() => void manager.handleSave()} type="button">
        salvar
      </button>
      <button
        onClick={() =>
          void manager.handleUpload(
            new File(["imagem"], "produto.jpg", { type: "image/jpeg" }),
            "cover",
          )
        }
        type="button"
      >
        enviar imagem
      </button>
      <button
        onClick={() => {
          const firstProduct = manager.products[0];
          if (firstProduct) {
            void manager.selectProduct(firstProduct);
          }
        }}
        type="button"
      >
        abrir produto
      </button>
    </>
  );
}

describe("useAdminProductsManager", () => {
  it("sends the latest dimensions on the first save and keeps the confirmed response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          product: { ...product, dimensions: { height: "5", length: "5", width: "5" } },
        }),
      ),
    );

    render(<ManagerHarness />);
    fireEvent.change(screen.getByLabelText("comprimento"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("largura"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("altura"), { target: { value: "5" } });

    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(screen.getByLabelText("aviso")).toHaveTextContent("Produto salvo.");
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body)).dimensions).toEqual({ height: "5", length: "5", width: "5" });
    expect(screen.getByLabelText("comprimento")).toHaveValue("5");
    expect(screen.getByLabelText("largura")).toHaveValue("5");
    expect(screen.getByLabelText("altura")).toHaveValue("5");
  });

  it("does not reset dimensions when the save fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Falhou" }), { status: 500 }),
    );

    render(<ManagerHarness />);
    fireEvent.change(screen.getByLabelText("comprimento"), { target: { value: "5" } });

    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(screen.getByLabelText("aviso")).toHaveTextContent("Falhou");
    });

    expect(screen.getByLabelText("comprimento")).toHaveValue("5");
  });

  it("shows a clear size limit message when the platform rejects a large image", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Request Entity Too Large", { status: 413 }),
    );

    render(<ManagerHarness />);
    fireEvent.click(screen.getByRole("button", { name: "enviar imagem" }));

    await waitFor(() => {
      expect(screen.getByLabelText("aviso")).toHaveTextContent(
        "A imagem é grande demais. Envie uma imagem de até 4 MB.",
      );
    });
  });

  it("sends only changed fields so a SKU update cannot clear existing prices", async () => {
    const initialSnapshot = {
      ...snapshot,
      products: [{ ...product, regularPrice: "140", salePrice: "120" }],
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ product: initialSnapshot.products[0] })),
    );

    render(<ManagerHarness initialSnapshot={initialSnapshot} />);
    fireEvent.change(screen.getByLabelText("sku"), { target: { value: "SKU-11856" } });
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toEqual({ sku: "SKU-11856" });
  });

  it("saves both prices with another changed field and keeps the confirmed values", async () => {
    const savedProduct = { ...product, regularPrice: "150", salePrice: "120", weight: "0.5" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ product: savedProduct })),
    );

    render(<ManagerHarness />);
    fireEvent.change(screen.getByLabelText("preço regular"), { target: { value: "150" } });
    fireEvent.change(screen.getByLabelText("preço promocional"), { target: { value: "120" } });
    fireEvent.change(screen.getByLabelText("peso"), { target: { value: "0.5" } });
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body))).toEqual({
      regularPrice: "150.00",
      salePrice: "120.00",
      weight: "0.5",
    });
    expect(screen.getByLabelText("preço regular")).toHaveValue("150");
    expect(screen.getByLabelText("preço promocional")).toHaveValue("120");
  });

  it("preserves prices when a save fails and allows intentionally clearing only the sale price", async () => {
    const initialSnapshot = {
      ...snapshot,
      products: [{ ...product, regularPrice: "140", salePrice: "120" }],
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Falhou" }), { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ product: { ...initialSnapshot.products[0], salePrice: "" } })),
      );

    render(<ManagerHarness initialSnapshot={initialSnapshot} />);
    fireEvent.change(screen.getByLabelText("preço regular"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(screen.getByLabelText("preço regular")).toHaveValue("150");
      expect(screen.getByLabelText("preço promocional")).toHaveValue("120");
    });

    fireEvent.change(screen.getByLabelText("preço promocional"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body))).toEqual({
      regularPrice: "150.00",
      salePrice: "",
    });
  });

  it("loads persisted variation prices before editing a variable product", async () => {
    const variableProduct = { ...product, regularPrice: "", salePrice: "", type: "variable" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ product: { ...variableProduct, regularPrice: "150", salePrice: "120" } }),
      ),
    );

    render(<ManagerHarness initialSnapshot={{ ...snapshot, products: [variableProduct] }} />);
    fireEvent.click(screen.getByRole("button", { name: "abrir produto" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/products/123", { cache: "no-store" });
      expect(screen.getByLabelText("preço regular")).toHaveValue("150");
      expect(screen.getByLabelText("preço promocional")).toHaveValue("120");
    });
  });

  it("does not report success or send an invalid price", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<ManagerHarness />);
    fireEvent.change(screen.getByLabelText("preço regular"), { target: { value: "invalido" } });
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("aviso")).toHaveTextContent("Informe um preço regular válido.");
  });

  it("keeps a newly created tag in the draft and sends its ID when saving", async () => {
    const createdTag = { id: 215, name: "teste", parent: 0, slug: "teste" };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ tag: createdTag }), { status: 201 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ product: { ...product, tags: [createdTag] } })),
      );

    render(<ManagerHarness />);
    fireEvent.change(screen.getByLabelText("nova tag"), { target: { value: "teste" } });
    fireEvent.click(screen.getByRole("button", { name: "adicionar tag nova" }));

    await waitFor(() => {
      expect(screen.getByLabelText("tags selecionadas")).toHaveTextContent("215");
    });

    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [, request] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(String(request.body)).tags).toEqual([215]);
    expect(screen.getByLabelText("tags selecionadas")).toHaveTextContent("215");
  });

  it("reuses existing tags, saves multiple tags once, and removes selected tags", async () => {
    const existingTag = { id: 8, name: "Existente", parent: 0, slug: "existente" };
    const createdTag = { id: 215, name: "teste", parent: 0, slug: "teste" };
    const initialSnapshot = { ...snapshot, tags: [existingTag] };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ tag: createdTag }), { status: 201 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ product: { ...product, tags: [existingTag, createdTag] } })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ product: { ...product, tags: [createdTag] } })),
      );

    render(<ManagerHarness initialSnapshot={initialSnapshot} />);
    fireEvent.click(screen.getByRole("button", { name: "adicionar tag existente" }));

    await waitFor(() => {
      expect(screen.getByLabelText("tags selecionadas")).toHaveTextContent("8");
    });

    fireEvent.click(screen.getByRole("button", { name: "adicionar tag existente" }));
    fireEvent.change(screen.getByLabelText("nova tag"), { target: { value: "teste" } });
    fireEvent.click(screen.getByRole("button", { name: "adicionar tag nova" }));

    await waitFor(() => {
      expect(screen.getByLabelText("tags selecionadas")).toHaveTextContent("8,215");
    });
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    expect(JSON.parse(String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body)).tags).toEqual([8, 215]);

    fireEvent.click(screen.getByRole("button", { name: "remover tag existente" }));
    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
    expect(JSON.parse(String((fetchMock.mock.calls[2] as [string, RequestInit])[1].body)).tags).toEqual([215]);
  });

  it("preserves selected tags when the product save fails", async () => {
    const existingTag = { id: 8, name: "Existente", parent: 0, slug: "existente" };
    const initialSnapshot = { ...snapshot, tags: [existingTag] };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Falhou" }), { status: 500 }),
    );

    render(<ManagerHarness initialSnapshot={initialSnapshot} />);
    fireEvent.click(screen.getByRole("button", { name: "adicionar tag existente" }));
    await waitFor(() => {
      expect(screen.getByLabelText("tags selecionadas")).toHaveTextContent("8");
    });

    fireEvent.click(screen.getByRole("button", { name: "salvar" }));

    await waitFor(() => {
      expect(screen.getByLabelText("tags selecionadas")).toHaveTextContent("8");
    });
  });

  it("does not clear the tag input when tag creation fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Falhou" }), { status: 500 }),
    );

    render(<ManagerHarness />);
    fireEvent.change(screen.getByLabelText("nova tag"), { target: { value: "teste" } });
    fireEvent.click(screen.getByRole("button", { name: "adicionar tag nova" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("nova tag")).toHaveValue("teste");
    });
  });
});
