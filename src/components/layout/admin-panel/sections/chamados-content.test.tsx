import { beforeEach, describe, expect, it, vi } from "vitest";

const getChamadosMock = vi.fn();
const getChamadoMock = vi.fn();

vi.mock("@/features/chamados", () => ({
  ChamadoOrderPanel: () => null,
  ChamadosList: () => null,
  ChamadoThreadPanel: () => null,
  getChamado: (id: number) => getChamadoMock(id),
  getChamados: (query: unknown) => getChamadosMock(query),
}));

const { ChamadosContent } = await import("./chamados-content");

const chamado = (threadId: number) => ({ threadId, orderNumber: `${threadId}` });

describe("ChamadosContent", () => {
  beforeEach(() => {
    getChamadosMock.mockReset();
    getChamadoMock.mockReset();
    getChamadosMock.mockResolvedValue({ items: [chamado(10), chamado(20)], total: 2 });
    getChamadoMock.mockImplementation(async (id: number) => chamado(id));
  });

  it("abre o chamado pedido na URL", async () => {
    await ChamadosContent({ searchParams: { chamado: "20" } });

    expect(getChamadoMock).toHaveBeenCalledExactlyOnceWith(20);
  });

  it("ainda entende o `?thread=` legado, que já saiu em notificações", async () => {
    await ChamadosContent({ searchParams: { thread: "20" } });

    expect(getChamadoMock).toHaveBeenCalledExactlyOnceWith(20);
  });

  it("sem chamado na URL, abre o primeiro da lista", async () => {
    await ChamadosContent({ searchParams: {} });

    expect(getChamadoMock).toHaveBeenCalledExactlyOnceWith(10);
  });

  it("ignora valor não numérico e volta para o primeiro da lista", async () => {
    await ChamadosContent({ searchParams: { chamado: "abc" } });

    expect(getChamadoMock).toHaveBeenCalledExactlyOnceWith(10);
  });

  it("não carrega chamado nenhum quando a lista está vazia", async () => {
    getChamadosMock.mockResolvedValue({ items: [], total: 0 });

    await ChamadosContent({ searchParams: {} });

    expect(getChamadoMock).not.toHaveBeenCalled();
  });

  it("com o chamado na URL, não espera a lista chegar para buscá-lo", async () => {
    let liberarLista: (value: unknown) => void = () => undefined;
    getChamadosMock.mockReturnValue(
      new Promise((resolve) => {
        liberarLista = resolve;
      }),
    );

    const rendering = ChamadosContent({ searchParams: { chamado: "20" } });
    await Promise.resolve();

    expect(getChamadoMock).toHaveBeenCalledWith(20);

    liberarLista({ items: [chamado(10)], total: 1 });
    await rendering;
  });

  it("lista só conversas com pedido, e repassa busca e situação", async () => {
    await ChamadosContent({ searchParams: { search: "14094", status: "ENCERRADO" } });

    expect(getChamadosMock).toHaveBeenCalledWith({
      kind: "chamado",
      search: "14094",
      status: "ENCERRADO",
    });
  });
});
