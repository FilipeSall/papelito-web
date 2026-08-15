import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminCategory, AdminSubcategory, AdminTaxonomySnapshot } from "@/lib/server/admin-taxonomy";

import { CategoriesManager } from "./categories-manager";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function subcategory(overrides: Partial<AdminSubcategory> = {}): AdminSubcategory {
  return {
    archivedAt: null,
    categoryId: 30,
    description: "",
    facet: "tamanho",
    id: 55,
    isActive: true,
    name: "M",
    productCount: 1,
    slug: "m",
    sortOrder: 6,
    ...overrides,
  };
}

function snapshot(subcategories: AdminSubcategory[]): AdminTaxonomySnapshot {
  const category: AdminCategory = {
    archivedAt: null,
    description: "",
    iconAttachmentId: null,
    iconUrl: null,
    id: 30,
    isActive: true,
    name: "Acessórios",
    productCount: { published: 6, total: 14 },
    seoDescription: "",
    seoTitle: "",
    slug: "acessorios",
    sortOrder: 3,
    subcategories,
  };

  return { categories: [category], collections: [], issues: [], version: 1 };
}

function modal() {
  return screen.getByRole("heading", { name: /subcategoria em acessórios/i }).closest("div")!
    .parentElement!;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("CategoriesManager - edição de subcategoria", () => {
  it("não deixa editar o slug de uma subcategoria que já tem produtos", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ subcategory: subcategory({ name: "Bandeja M" }) }), {
        status: 200,
      }),
    );

    render(<CategoriesManager snapshot={snapshot([subcategory()])} />);
    await user.click(screen.getByRole("button", { name: "Editar M" }));

    const slug = screen.getByLabelText(/slug/i);
    expect(slug).toBeDisabled();
    expect(screen.getByText(/bloqueado: a subcategoria já tem produtos/i)).toBeInTheDocument();

    const name = screen.getByLabelText(/nome/i);
    await user.clear(name);
    await user.type(name, "Bandeja M");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("/api/admin/subcategories/55");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({
      facet: "tamanho",
      isActive: true,
      name: "Bandeja M",
    });
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: /subcategoria em acessórios/i })).toBeNull(),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("mantém o slug editável enquanto a subcategoria não tem produto", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ subcategory: subcategory() }), { status: 200 }),
    );

    render(<CategoriesManager snapshot={snapshot([subcategory({ productCount: 0 })])} />);
    await user.click(screen.getByRole("button", { name: "Editar M" }));

    expect(screen.getByLabelText(/slug/i)).toBeEnabled();

    await user.clear(screen.getByLabelText(/slug/i));
    await user.type(screen.getByLabelText(/slug/i), "media");
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(JSON.parse(init.body as string)).toMatchObject({ slug: "media" });
  });

  it("mostra o motivo real da recusa dentro do modal, que continua aberto", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "papelito_subcategory_in_use",
          message: "Remova os vínculos de produto antes de desativar a subcategoria.",
        }),
        { status: 409 },
      ),
    );

    render(<CategoriesManager snapshot={snapshot([subcategory()])} />);
    await user.click(screen.getByRole("button", { name: "Editar M" }));
    await user.click(screen.getByRole("checkbox", { name: /subcategoria ativa/i }));
    await user.click(screen.getByRole("button", { name: /salvar/i }));

    const alert = await within(modal()).findByRole("alert");

    expect(alert).toHaveTextContent(
      "Remova os vínculos de produto antes de desativar a subcategoria.",
    );
    expect(screen.getByRole("heading", { name: /subcategoria em acessórios/i })).toBeInTheDocument();
  });

  it("limpa o erro do modal ao reabrir a edição", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Já existe uma subcategoria com esse slug." }), {
        status: 409,
      }),
    );

    render(<CategoriesManager snapshot={snapshot([subcategory()])} />);
    await user.click(screen.getByRole("button", { name: "Editar M" }));
    await user.click(screen.getByRole("button", { name: /salvar/i }));
    await within(modal()).findByRole("alert");

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    await user.click(screen.getByRole("button", { name: "Editar M" }));

    expect(within(modal()).queryByRole("alert")).toBeNull();
  });
});
