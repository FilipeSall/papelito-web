import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminCollection } from "@/lib/server/admin-taxonomy";

import { CuratedCollectionsPanel } from "./curated-collections-panel";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function collection(overrides: Partial<AdminCollection> = {}): AdminCollection {
  return {
    archivedAt: null,
    description: "",
    id: 1,
    isActive: true,
    name: "Premium",
    productCount: { published: 12, total: 15 },
    slug: "premium",
    sortOrder: 0,
    ...overrides,
  };
}

function stubFetch(response: { body?: unknown; ok?: boolean; status?: number } = {}) {
  const mock = vi.fn().mockResolvedValue({
    json: async () => response.body ?? {},
    ok: response.ok ?? true,
    status: response.status ?? 200,
  });

  vi.stubGlobal("fetch", mock);

  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockClear();
});

describe("CuratedCollectionsPanel", () => {
  it("lista as coleções com identificador, contagem e status", () => {
    render(
      <CuratedCollectionsPanel
        collections={[
          collection(),
          collection({
            id: 2,
            isActive: false,
            name: "Seleção Especial",
            productCount: { published: 0, total: 0 },
            slug: "selecao-especial",
            sortOrder: 1,
          }),
        ]}
        issues={[]}
      />,
    );

    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("premium")).toBeInTheDocument();
    expect(screen.getByText("selecao-especial")).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText("Inativa")).toBeInTheDocument();
    expect(screen.getByText(/2 coleções · 15 produtos associados/i)).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há coleção", () => {
    render(<CuratedCollectionsPanel collections={[]} issues={[]} />);

    expect(screen.getByText(/nenhuma coleção cadastrada/i)).toBeInTheDocument();
  });

  it("mostra o aviso de origem quando o backend falha", () => {
    render(<CuratedCollectionsPanel collections={[]} issues={["[coleções] wp fora do ar"]} />);

    expect(screen.getByText(/wp fora do ar/i)).toBeInTheDocument();
  });

  it("cria coleção enviando nome, identificador derivado e status", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();

    render(<CuratedCollectionsPanel collections={[]} issues={[]} />);

    await user.click(screen.getByRole("button", { name: /nova coleção/i }));
    await user.type(screen.getByLabelText(/^nome \*/i), "Edição Limitada");
    await user.click(screen.getByRole("button", { name: /criar coleção/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/admin/collections");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      description: "",
      isActive: true,
      name: "Edição Limitada",
      slug: "edicao-limitada",
    });
  });

  it("não chama a API quando o nome está vazio", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();

    render(<CuratedCollectionsPanel collections={[]} issues={[]} />);

    await user.click(screen.getByRole("button", { name: /nova coleção/i }));
    await user.click(screen.getByRole("button", { name: /criar coleção/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/informe o nome da coleção/i);
  });

  it("mostra a recusa do backend dentro do modal", async () => {
    const user = userEvent.setup();
    stubFetch({
      body: { message: "Já existe uma coleção com o identificador “premium”." },
      ok: false,
      status: 409,
    });

    render(<CuratedCollectionsPanel collections={[]} issues={[]} />);

    await user.click(screen.getByRole("button", { name: /nova coleção/i }));
    await user.type(screen.getByLabelText(/^nome \*/i), "Premium");
    await user.click(screen.getByRole("button", { name: /criar coleção/i }));

    expect(within(screen.getByRole("dialog")).getByRole("alert")).toHaveTextContent(
      /já existe uma coleção/i,
    );
  });

  it("trava o identificador quando a coleção já tem produtos", async () => {
    const user = userEvent.setup();

    render(<CuratedCollectionsPanel collections={[collection()]} issues={[]} />);

    await user.click(screen.getByRole("button", { name: /^editar premium$/i }));

    expect(screen.getByLabelText(/^identificador/i)).toBeDisabled();
    expect(screen.getByText(/a coleção já tem produtos/i)).toBeInTheDocument();
  });

  it("permite editar o identificador enquanto a coleção está vazia", async () => {
    const user = userEvent.setup();

    render(
      <CuratedCollectionsPanel
        collections={[collection({ productCount: { published: 0, total: 0 } })]}
        issues={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^editar premium$/i }));

    expect(screen.getByLabelText(/^identificador/i)).toBeEnabled();
  });

  it("arquiva pela rota da coleção", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();

    render(<CuratedCollectionsPanel collections={[collection({ id: 7 })]} issues={[]} />);

    await user.click(screen.getByRole("button", { name: /arquivar/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections/7", { method: "DELETE" });
  });

  it("oferece restaurar no lugar de arquivar quando já está arquivada", () => {
    render(
      <CuratedCollectionsPanel
        collections={[collection({ archivedAt: "2026-09-01 10:00:00", isActive: false })]}
        issues={[]}
      />,
    );

    expect(screen.getByText("Arquivada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /restaurar/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /arquivar/i })).not.toBeInTheDocument();
  });

  it("não oferece exclusão permanente enquanto a coleção está ativa", () => {
    render(<CuratedCollectionsPanel collections={[collection()]} issues={[]} />);

    expect(screen.queryByRole("button", { name: /excluir/i })).not.toBeInTheDocument();
  });

  it("exige confirmação antes de excluir em definitivo e diz o que se perde", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();

    render(
      <CuratedCollectionsPanel
        collections={[
          collection({
            archivedAt: "2026-09-01 10:00:00",
            id: 9,
            isActive: false,
            productCount: { published: 2, total: 3 },
          }),
        ]}
        issues={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^excluir$/i }));

    expect(screen.getByText(/vínculos com 3 produtos/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /excluir para sempre/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/collections/9?force=true", {
      method: "DELETE",
    });
  });

  it("cancelar a confirmação não chama a API", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();

    render(
      <CuratedCollectionsPanel
        collections={[collection({ archivedAt: "2026-09-01 10:00:00", isActive: false })]}
        issues={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^excluir$/i }));
    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reordena enviando a nova sequência de ids", async () => {
    const user = userEvent.setup();
    const fetchMock = stubFetch();

    render(
      <CuratedCollectionsPanel
        collections={[
          collection({ id: 1, sortOrder: 0 }),
          collection({ id: 2, name: "Destaques", slug: "destaques", sortOrder: 1 }),
        ]}
        issues={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /subir destaques/i }));

    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/admin/collections/reorder");
    expect(JSON.parse(init.body)).toEqual({ ids: [2, 1] });
  });
});
