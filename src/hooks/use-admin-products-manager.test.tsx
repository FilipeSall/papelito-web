import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      <output aria-label="tags selecionadas">{manager.draft.tagIds.join(",")}</output>
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

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "salvar" }));
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

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "salvar" }));
    });

    expect(screen.getByLabelText("comprimento")).toHaveValue("5");
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
